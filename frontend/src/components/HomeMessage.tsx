import './HomeMessage.css';
export default function HomeMessage({ message }: { message: string }) { if (!message.trim()) return null; return <section className="home-message"><p>{message}</p></section>; }
