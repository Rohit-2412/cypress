/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true,
    },
    images: {
        dangerouslyAllowSVG: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "hwqnxtrerzkkidxmlnfj.supabase.co",
                pathname: "**",
            },
        ],
    },
};

module.exports = nextConfig;
