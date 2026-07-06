// Dev-server compatibility: the local dev resolver only maps dynamic segments to [slug].js.
// Re-export the [id].js handler so /api/hero-slides/1 works locally and on Vercel.
import handler from "./[id].js";
export default handler;
