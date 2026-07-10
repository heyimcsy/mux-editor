/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  // Pages serves the repo at /mux-editor, not at the domain root. Dev stays at
  // "/" so `npm run dev` does not move to localhost:3000/mux-editor.
  basePath: process.env.NODE_ENV === "production" ? "/mux-editor" : "",
};

export default nextConfig;
