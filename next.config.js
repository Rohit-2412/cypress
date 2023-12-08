/** @type {import('next').NextConfig} */
const nextConfig = {
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
