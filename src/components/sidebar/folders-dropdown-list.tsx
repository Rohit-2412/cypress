"use client";

import React, { useEffect, useState } from "react";

import { Accordion } from "../ui/accordion";
import Dropdown from "./dropdown";
import { Folder } from "@/lib/supabase/supabase.types";
import { PlusIcon } from "lucide-react";
import TooltipComponent from "../global/tooltip-component";
import { createFolder } from "@/lib/supabase/queries";
import { toast } from "../ui/use-toast";
import { useAppState } from "@/lib/providers/state-provider";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { v4 } from "uuid";

interface FoldersDropdownListProps {
    workspaceFolders: Folder[];
    workspaceId: string;
}

const FoldersDropdownList: React.FC<FoldersDropdownListProps> = ({
    workspaceFolders,
    workspaceId,
}) => {
    // keep track of local state of folders

    // TODO: set real time updates
    const { state, dispatch, folderId } = useAppState();
    const [folders, SetFolders] = useState(workspaceFolders);
    const { subscription } = useSupabaseUser();

    // effect set initial state based on server data
    useEffect(() => {
        if (workspaceFolders.length > 0) {
            dispatch({
                type: "SET_FOLDERS",
                payload: {
                    folders: workspaceFolders.map((folder) => ({
                        ...folder,
                        files:
                            state.workspaces
                                .find(
                                    (workspace) => workspace.id === workspaceId
                                )
                                ?.folders.find((f) => f.id === folder.id)
                                ?.files || [],
                    })),
                    workspaceId,
                },
            });
        }
    }, [workspaceFolders, workspaceId]);

    // state
    useEffect(() => {
        SetFolders(
            state.workspaces.find((w) => w.id === workspaceId)?.folders || []
        );
    }, [state]);

    // add folder
    const addFolderHandler = async () => {
        if (folders.length >= 3 && !subscription) {
            // open modal
        } else {
            const newFolder: Folder = {
                data: null,
                id: v4(),
                bannerUrl: "",
                createdAt: new Date().toISOString(),
                iconId: "📄",
                inTrash: null,
                title: "Untitled",
                workspaceId,
            };
            dispatch({
                type: "ADD_FOLDER",
                payload: {
                    folder: { ...newFolder, files: [] },
                    workspaceId,
                },
            });
            const { data, error } = await createFolder(newFolder);

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not create the folder",
                });
            } else {
                toast({
                    title: "Success",
                    description: "Folder created successfully",
                });
            }
        }
    };
    return (
        <>
            <div className="flex sticky  z-20  top-0  bg-background  w-full   h-10  group/title  justify-between  items-center  pr-4  text-Neutrals/neutrals-8">
                <span className="text-Neutrals-8 font-bold text-xs">
                    FOLDERS
                </span>
                <TooltipComponent message="Create Folder">
                    <PlusIcon
                        className="group-hover/title:inline-block hidden cursor-pointer hover:dark:text-white"
                        onClick={addFolderHandler}
                    />
                </TooltipComponent>
            </div>

            <Accordion
                type="multiple"
                defaultValue={[folderId || ""]}
                className="pb-20"
            >
                {folders
                    .filter((folder) => !folder.inTrash)
                    .map((folder) => (
                        <div key={folder.id}>
                            <Dropdown
                                key={folder.id}
                                id={folder.id}
                                iconId={folder.iconId}
                                title={folder.title}
                                listType="folder"
                            />
                        </div>
                    ))}
            </Accordion>
        </>
    );
};

export default FoldersDropdownList;
