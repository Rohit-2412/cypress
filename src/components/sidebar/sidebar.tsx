import {
    getCollaboratingWorkspaces,
    getFolders,
    getPrivateWorkspaces,
    getSharedWorkspaces,
    getUserSubscriptionStatus,
} from "@/lib/supabase/queries";

import FoldersDropdownList from "./folders-dropdown-list";
import NativeNavigation from "./native-navigation";
import PlanUsage from "./plan-usage";
import React from "react";
import { ScrollArea } from "../ui/scroll-area";
import WorkspaceDropdown from "./workspace-dropdown";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { twMerge } from "tailwind-merge";

// import WorkspaceDropdown from './workspace-dropdown';
// import PlanUsage from './plan-usage';
// import NativeNavigation from './native-navigation';
// import { ScrollArea } from '../ui/scroll-area';
// import FoldersDropdownList from './folders-dropdown-list';
// import UserCard from './user-card';
interface SidebarProps {
    params: {
        workspaceId: string;
    };
    className?: string;
}

const Sidebar: React.FC<SidebarProps> = async ({ params, className }) => {
    const supabase = createServerComponentClient({ cookies });

    // get the user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // check for subscription
    const { data: subscriptionData, error: subscriptionError } =
        await getUserSubscriptionStatus(user.id);

    // get all folders
    const { data: workspaceFolderData, error: foldersError } = await getFolders(
        params.workspaceId
    );

    // if any error
    if (subscriptionError || foldersError) redirect("/dashboard");

    const [privateWorkspaces, collaboratingWorkspaces, sharedWorkspaces] =
        await Promise.all([
            getPrivateWorkspaces(user.id),
            getCollaboratingWorkspaces(user.id),
            getSharedWorkspaces(user.id),
        ]);

    return (
        <aside
            className={twMerge(
                "hidden sm:flex sm:flex-col w-[280px] shrink-0 p-4 md:gap-4",
                className
            )}
        >
            <WorkspaceDropdown
                privateWorkspaces={privateWorkspaces}
                collaboratingWorkspaces={collaboratingWorkspaces}
                sharedWorkspaces={sharedWorkspaces}
                defaultValue={[
                    ...privateWorkspaces,
                    ...collaboratingWorkspaces,
                    ...sharedWorkspaces,
                ].find((workspace) => workspace.id === params.workspaceId)}
            />
            <PlanUsage
                foldersLength={workspaceFolderData?.length || 0}
                subscription={subscriptionData}
            />

            <NativeNavigation myWorkspaceId={params.workspaceId} />

            <ScrollArea className="h-[450px] overflow-scroll relative">
                <div className="w-full pointer-events-none absolute bottom-0 h-20 bg-gradient-to-r from-background to-transparent z-40" />
                <FoldersDropdownList
                    workspaceFolders={workspaceFolderData || []}
                    workspaceId={params.workspaceId}
                />
            </ScrollArea>
        </aside>
    );
};

export default Sidebar;
