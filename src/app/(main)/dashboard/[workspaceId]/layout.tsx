import React from "react";
import Sidebar from "@/components/sidebar/sidebar";

interface WorkspaceIdPageLayoutProps {
    children: React.ReactNode;
    params: any;
}
const WorkspaceIdPageLayout: React.FC<WorkspaceIdPageLayoutProps> = ({
    children,
    params,
}) => {
    return (
        <main className="flex overflow-hidden h-screen w-screen">
            <Sidebar params={params} />

            {/* Mobile Sidebar */}

            <div className="dark:border-Neutrals-12/70  border-l-[1px]  w-full  relative  overflow-scroll">
                {children}
            </div>
        </main>
    );
};

export default WorkspaceIdPageLayout;
