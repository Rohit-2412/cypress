"use client";

import "quill/dist/quill.snow.css";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { File, Folder, workspace } from "@/lib/supabase/supabase.types";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip";
import {
    deleteFile,
    deleteFolder,
    updateFile,
    updateFolder,
    updateWorkspace,
} from "@/lib/supabase/queries";

import { Badge } from "../ui/badge";
import BannerImage from "../../../public/BannerImage.png";
import BannerUpload from "../banner-upload/banner-upload";
import { Button } from "../ui/button";
import EmojiPicker from "../global/emoji-picker";
import Image from "next/image";
import { XCircleIcon } from "lucide-react";
import { collaborators } from "@/lib/supabase/schema";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAppState } from "@/lib/providers/state-provider";
import { usePathname } from "next/navigation";
import { useToast } from "../ui/use-toast";

interface QuillEditorProps {
    fileId: string;
    dirDetails: File | Folder | workspace;
    dirType: "workspace" | "folder" | "file";
}

var TOOLBAR_OPTIONS = [
    ["bold", "italic", "underline", "strike"], // toggled buttons
    ["blockquote", "code-block"],

    [{ header: 1 }, { header: 2 }], // custom button values
    [{ list: "ordered" }, { list: "bullet" }],
    [{ script: "sub" }, { script: "super" }], // superscript/subscript
    [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    [{ direction: "rtl" }], // text direction

    [{ size: ["small", false, "large", "huge"] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ font: [] }],
    [{ align: [] }],

    ["clean"], // remove formatting button
];

const QuillEditor: React.FC<QuillEditorProps> = ({
    fileId,
    dirDetails,
    dirType,
}: QuillEditorProps) => {
    const { state, dispatch, folderId, workspaceId } = useAppState();
    const [quill, setQuill] = useState<any>(null);
    const pathname = usePathname();
    const { toast } = useToast();
    const supabase = createClientComponentClient();
    const [collaborators, setCollaborators] = useState<
        {
            id: string;
            email: string;
            avatarUrl: string;
        }[]
    >([
        {
            id: "1",
            email: "abc@gmail.com",
            avatarUrl: "https://avatars.githubusercontent.com/u/11083281?v=4",
        },
        {
            id: "2",
            email: "def@gmail.com",
            avatarUrl: "https://avatars.githubusercontent.com/u/11083281?v=4",
        },
        {
            id: "3",
            email: "rk21@gmail.com",
            avatarUrl: "https://avatars.githubusercontent.com/u/11083281?v=4",
        },
    ]);
    const [saving, setSaving] = useState(false);

    const [deletingBanner, setDeletingBanner] = useState(false);
    const details = useMemo(() => {
        let selectedDir;

        if (dirType == "file") {
            selectedDir = state.workspaces
                .find((workspace) => workspace.id == workspaceId)
                ?.folders.find((folder) => folder.id == folderId)
                ?.files.find((file) => file.id == fileId);
        } else if (dirType == "folder") {
            selectedDir = state.workspaces
                .find((workspace) => workspace.id == workspaceId)
                ?.folders.find((folder) => folder.id == folderId);
        } else if (dirType == "workspace") {
            selectedDir = state.workspaces.find(
                (workspace) => workspace.id == workspaceId
            );
        }

        if (selectedDir) return selectedDir;

        return {
            title: dirDetails.title,
            iconId: dirDetails.iconId,
            createdAt: dirDetails.createdAt,
            data: dirDetails.data,
            inTrash: dirDetails.inTrash,
            bannerUrl: dirDetails.bannerUrl,
        } as workspace | Folder | File;
    }, [state, folderId, workspaceId]);

    const breadCrumbs = useMemo(() => {
        if (!pathname || !state.workspaces || !workspaceId) return;

        const segments = pathname
            .split("/")
            .filter((val) => val != "dashboard" && val);

        const workspaceDetails = state.workspaces.find(
            (workspace) => workspace.id == workspaceId
        );

        const workspaceBreadCrumb = workspaceDetails
            ? `${workspaceDetails.iconId} ${workspaceDetails.title}`
            : null;

        if (segments.length == 1) {
            return workspaceBreadCrumb;
        }

        const folderSegment = segments[1];
        const folderDetails = workspaceDetails?.folders.find(
            (folder) => folder.id == folderSegment
        );

        const folderBreadCrumb = folderDetails
            ? `/ ${folderDetails.iconId} ${folderDetails.title}`
            : null;

        if (segments.length == 2) {
            return `${workspaceBreadCrumb} ${folderBreadCrumb}`;
        }

        const fileSegment = segments[2];
        const fileDetails = folderDetails?.files.find(
            (file) => file.id == fileSegment
        );

        const fileBreadCrumb = fileDetails
            ? `/ ${fileDetails.iconId} ${fileDetails.title}`
            : null;

        if (segments.length == 3) {
            return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
        }
    }, [state]);

    const wrapperRef = useCallback(async (wrapper: any) => {
        if (typeof window != undefined) {
            if (wrapper == null) return;
            wrapper.innerHTML = "";

            const editor = document.createElement("div");
            wrapper.append(editor);

            const Quill = (await import("quill")).default;

            // TODO: cursor

            const q = new Quill(editor, {
                theme: "snow",
                modules: {
                    toolbar: TOOLBAR_OPTIONS,
                    // TODO: cursor,
                },
            });

            setQuill(q);
        }
    }, []);

    const restoreFileHandler = async () => {
        if (dirType == "file") {
            if (!folderId || !workspaceId) return;

            dispatch({
                type: "UPDATE_FILE",
                payload: {
                    file: { inTrash: "" },
                    fileId,
                    workspaceId,
                    folderId,
                },
            });

            await updateFile({ inTrash: "" }, fileId);
        }

        if (dirType == "folder") {
            if (!workspaceId) return;

            dispatch({
                type: "UPDATE_FOLDER",
                payload: {
                    folder: { inTrash: "" },
                    folderId: fileId,
                    workspaceId,
                },
            });

            await updateFolder({ inTrash: "" }, fileId);
        }
    };

    const deleteFileHandler = async () => {
        if (dirType == "file") {
            if (!folderId || !workspaceId) return;

            dispatch({
                type: "DELETE_FILE",
                payload: {
                    fileId,
                    workspaceId,
                    folderId,
                },
            });

            await deleteFile(fileId);
        }

        if (dirType == "folder") {
            if (!workspaceId) return;

            dispatch({
                type: "DELETE_FOLDER",
                payload: {
                    folderId: fileId,
                    workspaceId,
                },
            });

            await deleteFolder(fileId);
        }
    };

    const onIconChange = async (icon: string) => {
        if (!fileId) return;

        if (dirType == "workspace") {
            dispatch({
                type: "UPDATE_WORKSPACE",
                payload: {
                    workspace: { iconId: icon },
                    workspaceId: fileId,
                },
            });

            await updateWorkspace({ iconId: icon }, fileId);
        }

        if (dirType == "folder") {
            if (!workspaceId) return;

            dispatch({
                type: "UPDATE_FOLDER",
                payload: {
                    folder: { iconId: icon },
                    folderId: fileId,
                    workspaceId,
                },
            });

            await updateFolder({ iconId: icon }, fileId);
        }

        if (dirType == "file") {
            if (!folderId || !workspaceId) return;

            dispatch({
                type: "UPDATE_FILE",
                payload: {
                    file: { iconId: icon },
                    fileId,
                    workspaceId,
                    folderId,
                },
            });

            await updateFile({ iconId: icon }, fileId);
        }
    };

    const deleteBanner = async () => {
        if (!fileId) return;
        setDeletingBanner(true);

        if (dirType == "workspace") {
            dispatch({
                type: "UPDATE_WORKSPACE",
                payload: {
                    workspace: { bannerUrl: "" },
                    workspaceId: fileId,
                },
            });

            await updateWorkspace({ bannerUrl: "" }, fileId);

            const { error } = await supabase.storage
                .from("file-banners")
                .remove([`banner-${fileId}`]);

            if (error) {
                toast({
                    title: "Error",
                    description: "Error deleting banner",
                    variant: "destructive",
                });
            }
        } else if (dirType == "folder") {
            if (!workspaceId) return;

            dispatch({
                type: "UPDATE_FOLDER",
                payload: {
                    folder: { bannerUrl: "" },
                    folderId: fileId,
                    workspaceId,
                },
            });

            await updateFolder({ bannerUrl: "" }, fileId);

            const { error } = await supabase.storage
                .from("file-banners")
                .remove([`banner-${fileId}`]);

            if (error) {
                toast({
                    title: "Error",
                    description: "Error deleting banner",
                    variant: "destructive",
                });
            }
        } else if (dirType == "file") {
            if (!folderId || !workspaceId) return;

            dispatch({
                type: "UPDATE_FILE",
                payload: {
                    file: { bannerUrl: "" },
                    fileId,
                    workspaceId,
                    folderId,
                },
            });

            await updateFile({ bannerUrl: "" }, fileId);

            const { error } = await supabase.storage
                .from("file-banners")
                .remove([`banner-${fileId}`]);

            if (error) {
                toast({
                    title: "Error",
                    description: "Error deleting banner",
                    variant: "destructive",
                });
            }
        }

        setDeletingBanner(false);
    };
    return (
        <>
            <div className="relative">
                {details.inTrash && (
                    <article className="py-2 z-40 bg-[#EB5757] flex md:flex-row flex-col justify-center items-center gap-4 flex-wrap">
                        <div className="flex flex-col md:flex-row gap-2 justify-center items-center">
                            <span className="text-white">
                                This {dirType} is in trash
                            </span>
                            <Button
                                variant={"outline"}
                                size={"sm"}
                                className="bg-transparent text-white border-white border-2 hover:bg-white hover:text-[#EB5757]"
                                onClick={restoreFileHandler}
                            >
                                Restore
                            </Button>
                            <Button
                                variant={"outline"}
                                size={"sm"}
                                className="bg-transparent text-white border-white border-2 hover:bg-white hover:text-[#EB5757]"
                                onClick={deleteFileHandler}
                            >
                                Delete
                            </Button>
                        </div>

                        <span className="tex-sm text-white">
                            {details.inTrash}
                        </span>
                    </article>
                )}
                <div className="flex flex-col-reverse justify-center p-8 sm:flex-row sm:justify-between sm:p-2 sm:items-center">
                    <div>{breadCrumbs}</div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10">
                            {collaborators?.map((collaborator) => (
                                <TooltipProvider key={collaborator.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Avatar className="-ml-3 bg-background border-2 border-white flex items-center justify-center h-8 w-8 rounded-full">
                                                <AvatarImage
                                                    className="rounded-full"
                                                    src={collaborator.avatarUrl}
                                                />

                                                <AvatarFallback>
                                                    {collaborator.email
                                                        .substring(0, 2)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            User name
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                        {saving ? (
                            <Badge
                                variant={"secondary"}
                                className="bg-orange-600 top-4 text-white right-4 z-50"
                            >
                                Saving...
                            </Badge>
                        ) : (
                            <Badge className="bg-green-600 top-4 text-white right-4 z-50">
                                Saved
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
            {details.bannerUrl && (
                <div className="relative w-full h-[200px]">
                    <Image
                        src={
                            supabase.storage
                                .from("file-banners")
                                .getPublicUrl(details.bannerUrl).data.publicUrl
                        }
                        layout="fill"
                        objectFit="cover"
                        objectPosition="center"
                        className="w-full md:h-48 h-20 object-cover object-center"
                        alt="banner"
                    />
                </div>
            )}

            <div className="flex items-center justify-center flex-col mt-2 relative">
                <div className="w-full self-center max-w-[800px] flex flex-col px-7 lg:py-8">
                    <div className="text-6xl">
                        <EmojiPicker getValue={onIconChange}>
                            <div className="w-24 cursor-pointer transition-colors h-24 flex items-center justify-center hover:bg-muted rounded-xl">
                                {details.iconId}
                            </div>
                        </EmojiPicker>
                    </div>
                    <div className="flex">
                        <BannerUpload
                            dirType={dirType}
                            id={fileId}
                            className="mt-2 text-sm text-muted-foreground p-2 hover:text-card-foreground transition-all rounded-md"
                        >
                            {details.bannerUrl ? "Update banner" : "Add banner"}
                        </BannerUpload>
                        {details.bannerUrl && (
                            <Button
                                onClick={deleteBanner}
                                disabled={deletingBanner}
                                variant={"ghost"}
                                className="gap-2 hover:bg-background flex items-center justify-center mt-2 text-sm text-muted-foreground p-2 rounded-md w-36"
                            >
                                <span className="whitespace-nowrap font-normal">
                                    Remove banner
                                </span>
                                <XCircleIcon size={16} />
                            </Button>
                        )}
                    </div>
                    <span className="text-muted-foreground text-3xl font-bold h-9">
                        {details.title}
                    </span>
                    <span className="text-muted-foreground text-sm ">
                        {dirType.toUpperCase()}
                    </span>
                </div>

                <div
                    id="container"
                    ref={wrapperRef}
                    className="max-w-[800px]"
                ></div>
            </div>
        </>
    );
};
export default QuillEditor;
