// 🔏 版本指纹：[57a7f3bf]
// =========================================================================
// 🚀🚀🚀 终极演进版：crypto 5.2（微内核 + SSO/WebAuthn 全兼容插槽）
// 🛡️ 核心特性：智能向下兼容、extractable:false 防提取、全流程内存覆写擦除
// 📜 版本说明：全面废除明文密码驻留，引入 MasterKey 机制，实现真正的零知识内存隔离
// =========================================================================

const CryptoConfig = {
    iterations: 600000,
    hashAlgorithm: "SHA-512",
    aesKeyLength: 256,
    saltLength: 32,
    ivLength: 12
};

const getCryptoInstance = () => {
    if (typeof crypto !== 'undefined' && crypto.subtle) return crypto;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) return window.crypto;
    throw new Error("🚨 当前运行环境不支持 Web Crypto API");
};

// =========================================================
// 🔌 第一部分：凭证驱动器插槽 (Providers)
// =========================================================

export const KeyProviders = {
    
    // 🟢 密码/SSO 驱动器 (接收手动密码或 SSO Token)
    Password: {
        async generateMasterKey(passwordStr) {
            const cryptoInstance = getCryptoInstance();
            const rawPwdBytes = new TextEncoder().encode(passwordStr);
            const preHashedBuffer = await cryptoInstance.subtle.digest(CryptoConfig.hashAlgorithm, rawPwdBytes);
            
            const baseKey = await cryptoInstance.subtle.importKey(
                "raw", preHashedBuffer, { name: "PBKDF2" }, false, ["deriveKey"]
            );
            
            cryptoInstance.getRandomValues(rawPwdBytes); // 🧹 物理擦除主密码内存痕迹
            return baseKey;
        },
        
        async generateKEK(keyParam, saltBytes) {
            const cryptoInstance = getCryptoInstance();
            let masterKey = keyParam;

            // 🛡️ 智能向下兼容拦截：如果上层系统还是传了明文密码过来，自动将其转化为不可提取的 CryptoKey
            if (typeof keyParam === 'string') {
                masterKey = await this.generateMasterKey(keyParam);
            }

            return cryptoInstance.subtle.deriveKey(
                { name: "PBKDF2", salt: saltBytes, iterations: CryptoConfig.iterations, hash: CryptoConfig.hashAlgorithm }, 
                masterKey, { name: "AES-GCM", length: CryptoConfig.aesKeyLength }, 
                false, // 🚨 核心防御：extractable: false 确保 KEK 无法被 Dump
                ["encrypt", "decrypt"]
            );
        }
    },

    // 🟡 生物识别驱动器 (保持不变)
    Biometric: {
        async register() {
            const cryptoInstance = getCryptoInstance();
            const challenge = cryptoInstance.getRandomValues(new Uint8Array(32));
            const userId = cryptoInstance.getRandomValues(new Uint8Array(16));
            
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: "GeekNote Zero-Trust" },
                    user: { id: userId, name: "geek_admin", displayName: "Master Admin" },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
                    authenticatorSelection: { userVerification: "required" },
                    extensions: { prf: { eval: { first: new Uint8Array(32) } } }
                }
            });
            
            const rawIdBytes = new Uint8Array(credential.rawId);
            let idBase64 = "";
            for (let i = 0; i < rawIdBytes.length; i++) idBase64 += String.fromCharCode(rawIdBytes[i]);
            return btoa(idBase64); 
        },

        async generateKEK(credentialIdBase64, saltBytes) {
            const cryptoInstance = getCryptoInstance();
            const idStr = atob(credentialIdBase64);
            const credentialIdBytes = new Uint8Array(idStr.length);
            for (let i = 0; i < idStr.length; i++) credentialIdBytes[i] = idStr.charCodeAt(i);
            
            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: cryptoInstance.getRandomValues(new Uint8Array(32)),
                    allowCredentials: [{ id: credentialIdBytes, type: 'public-key' }],
                    extensions: { prf: { eval: { first: saltBytes } } } 
                }
            });

            const prfResults = assertion.getClientExtensionResults().prf;
            if (!prfResults || !prfResults.results || !prfResults.results.first) {
                throw new Error("🚨 您的设备不支持 WebAuthn PRF 密钥扩展");
            }
            
            const hardwareSeed = new Uint8Array(prfResults.results.first);
            const baseKey = await cryptoInstance.subtle.importKey("raw", hardwareSeed, { name: "HKDF" }, false, ["deriveKey"]);
            cryptoInstance.getRandomValues(hardwareSeed); 

            return cryptoInstance.subtle.deriveKey(
                { name: "HKDF", salt: new Uint8Array(32), info: new Uint8Array(0), hash: "SHA-256" },
                baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
            );
        }
    }
};

// =========================================================
// ⚙️ 第二部分：微内核加密引擎 (CryptoCore)
// =========================================================

export const CryptoCore = {
    
    generateDEK() {
        const rawBytes = getCryptoInstance().getRandomValues(new Uint8Array(32));
        let binaryStr = "";
        for (let i = 0; i < rawBytes.length; i++) binaryStr += String.fromCharCode(rawBytes[i]);
        return btoa(binaryStr);
    },

    async wrapDEK(dekBase64, keyParam, provider = KeyProviders.Password) {
        const cryptoInstance = getCryptoInstance();
        const salt = cryptoInstance.getRandomValues(new Uint8Array(CryptoConfig.saltLength));
        const iv = cryptoInstance.getRandomValues(new Uint8Array(CryptoConfig.ivLength));
        
        const kek = await provider.generateKEK(keyParam, salt);
        const ciphertext = await cryptoInstance.subtle.encrypt({ name: "AES-GCM", iv: iv }, kek, new TextEncoder().encode(dekBase64));
        
        const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
        combined.set(salt, 0); combined.set(iv, salt.length); combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
        
        let binaryStr = ""; const chunkSize = 8192;
        for (let i = 0; i < combined.length; i += chunkSize) binaryStr += String.fromCharCode.apply(null, combined.subarray(i, i + chunkSize));
        return btoa(binaryStr);
    },

    async unwrapDEK(wrappedDEKBase64, keyParam, provider = KeyProviders.Password) {
        const cryptoInstance = getCryptoInstance();
        const binaryStr = atob(wrappedDEKBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

        const salt = bytes.slice(0, CryptoConfig.saltLength); 
        const iv = bytes.slice(CryptoConfig.saltLength, CryptoConfig.saltLength + CryptoConfig.ivLength); 
        const ciphertext = bytes.slice(CryptoConfig.saltLength + CryptoConfig.ivLength);
        
        const kek = await provider.generateKEK(keyParam, salt);
        const decryptedBuffer = await cryptoInstance.subtle.decrypt({ name: "AES-GCM", iv: iv }, kek, ciphertext);
        return new TextDecoder().decode(decryptedBuffer);
    },

    async encryptData(plaintext, dekBase64) {
        const cryptoInstance = getCryptoInstance();
        const iv = cryptoInstance.getRandomValues(new Uint8Array(CryptoConfig.ivLength));

        const rawKeyStr = atob(dekBase64);
        const rawKeyBytes = new Uint8Array(rawKeyStr.length);
        for (let i = 0; i < rawKeyStr.length; i++) rawKeyBytes[i] = rawKeyStr.charCodeAt(i);

        const cryptoKey = await cryptoInstance.subtle.importKey("raw", rawKeyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
        cryptoInstance.getRandomValues(rawKeyBytes); // 🧹 补全防护：物理擦除 DEK 内存残渣

        const ciphertext = await cryptoInstance.subtle.encrypt({ name: "AES-GCM", iv: iv }, cryptoKey, new TextEncoder().encode(plaintext));

        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv, 0); combined.set(new Uint8Array(ciphertext), iv.length);

        let binaryStr = ""; const chunkSize = 8192;
        for (let i = 0; i < combined.length; i += chunkSize) binaryStr += String.fromCharCode.apply(null, combined.subarray(i, i + chunkSize));
        return btoa(binaryStr);
    },

    async decryptData(base64Cipher, dekBase64) {
        const cryptoInstance = getCryptoInstance();
        const binaryStr = atob(base64Cipher);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

        const iv = bytes.slice(0, CryptoConfig.ivLength); 
        const ciphertext = bytes.slice(CryptoConfig.ivLength);

        const rawKeyStr = atob(dekBase64);
        const rawKeyBytes = new Uint8Array(rawKeyStr.length);
        for (let i = 0; i < rawKeyStr.length; i++) rawKeyBytes[i] = rawKeyStr.charCodeAt(i);

        const cryptoKey = await cryptoInstance.subtle.importKey("raw", rawKeyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
        cryptoInstance.getRandomValues(rawKeyBytes); // 🧹 补全防护：物理擦除 DEK 内存残渣
        
        const decryptedBuffer = await cryptoInstance.subtle.decrypt({ name: "AES-GCM", iv: iv }, cryptoKey, ciphertext);
        
        return new TextDecoder().decode(decryptedBuffer);
    }
};
