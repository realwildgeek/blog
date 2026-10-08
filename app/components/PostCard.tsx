// app/components/PostCard.tsx
import { Link } from "react-router";

interface PostCardProps {
  title: string;
  date: string;
  slug: string;
}

export function PostCard({ title, date, slug }: PostCardProps) {
  return (
    <Link to={`/${slug}`} className="post-card">
      <div className="post-date">{date}</div>
      <h2 className="post-title">{title}</h2>
    </Link>
  );
}