import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // 首页路由
  index("routes/home.tsx"),
  
  // 👇 新增这一行：注册我们的动态文章路由
  route(":slug", "routes/$slug.tsx")
] satisfies RouteConfig;