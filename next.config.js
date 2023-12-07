/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true,
    },
    images: {
        domains: ["hwqnxtrerzkkidxmlnfj.supabase.co"],
    },
};

module.exports = nextConfig;
