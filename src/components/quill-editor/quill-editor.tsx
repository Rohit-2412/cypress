"use client";

import "quill/dist/quill.snow.css";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { File, Folder, workspace } from "@/lib/supabase/supabase.types";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip";
import {
    deleteFile,
    deleteFolder,
    findUser,
    getFileDetails,
    getFolderDetails,
    getWorkspaceDetails,
    updateFile,
    updateFolder,
    updateWorkspace,
} from "@/lib/supabase/queries";
import { usePathname, useRouter } from "next/navigation";

import { Badge } from "../ui/badge";
import BannerImage from "../../../public/BannerImage.png";
import BannerUpload from "../banner-upload/banner-upload";
import { Button } from "../ui/button";
import EmojiPicker from "../global/emoji-picker";
import Image from "next/image";
import { XCircleIcon } from "lucide-react";
import { collaborators } from "@/lib/supabase/schema";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getUserAvatar } from "@/lib/utils";
import { useAppState } from "@/lib/providers/state-provider";
import { useSocket } from "@/lib/providers/socket-provider";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
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
    const router = useRouter();
    const { toast } = useToast();
    const { socket, isConnected } = useSocket();
    const pathname = usePathname();
    const { user } = useSupabaseUser();
    const supabase = createClientComponentClient();
    const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const { state, dispatch, folderId, workspaceId } = useAppState();

    const [quill, setQuill] = useState<any>(null);
    const [collaborators, setCollaborators] = useState<
        { id: string; email: string; avatarUrl: string }[]
    >([]);
    const [saving, setSaving] = useState(false);
    const [deletingBanner, setDeletingBanner] = useState(false);
    const [localCursors, setLocalCursors] = useState<any>([]);

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
            const QuillCursors = (await import("quill-cursors")).default;
            Quill.register("modules/cursors", QuillCursors);

            const q = new Quill(editor, {
                theme: "snow",
                modules: {
                    toolbar: TOOLBAR_OPTIONS,
                    cursors: {
                        transformOnTextChange: true,
                    },
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

            router.replace(`/dashboard/${workspaceId}`);
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

            router.replace(`/dashboard/${workspaceId}`);
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

    // fetch information and update state
    useEffect(() => {
        if (!fileId) return;

        const fetchInformation = async () => {
            if (dirType === "file") {
                const { data: selectedDir, error } = await getFileDetails(
                    fileId
                );
                if (error || !selectedDir) {
                    return router.replace("/dashboard");
                }

                if (!selectedDir[0]) {
                    if (!workspaceId) return;
                    return router.replace(`/dashboard/${workspaceId}`);
                }
                if (!workspaceId || quill === null) return;
                if (!selectedDir[0].data) return;
                quill.setContents(JSON.parse(selectedDir[0].data || ""));
                dispatch({
                    type: "UPDATE_FILE",
                    payload: {
                        file: { data: selectedDir[0].data },
                        fileId,
                        folderId: selectedDir[0].folderId,
                        workspaceId,
                    },
                });
            }
            if (dirType === "folder") {
                const { data: selectedDir, error } = await getFolderDetails(
                    fileId
                );
                if (error || !selectedDir) {
                    return router.replace("/dashboard");
                }

                if (!selectedDir[0]) {
                    router.replace(`/dashboard/${workspaceId}`);
                }
                if (quill === null) return;
                if (!selectedDir[0].data) return;
                quill.setContents(JSON.parse(selectedDir[0].data || ""));
                dispatch({
                    type: "UPDATE_FOLDER",
                    payload: {
                        folderId: fileId,
                        folder: { data: selectedDir[0].data },
                        workspaceId: selectedDir[0].workspaceId,
                    },
                });
            }
            if (dirType === "workspace") {
                const { data: selectedDir, error } = await getWorkspaceDetails(
                    fileId
                );
                if (error || !selectedDir) {
                    return router.replace("/dashboard");
                }
                if (!selectedDir[0] || quill === null) return;
                if (!selectedDir[0].data) return;
                quill.setContents(JSON.parse(selectedDir[0].data || ""));
                dispatch({
                    type: "UPDATE_WORKSPACE",
                    payload: {
                        workspace: { data: selectedDir[0].data },
                        workspaceId: fileId,
                    },
                });
            }
        };
        fetchInformation();
    }, [fileId, workspaceId, quill, dirType]);

    // room for application
    useEffect(() => {
        if (socket === null || quill === null || !fileId) return;

        socket.emit("create-room", fileId);
    }, [socket, quill, fileId]);

    // send quill changes to all clients
    useEffect(() => {
        if (quill === null || socket === null || !fileId || !user) return;

        const selectionChangeHandler = (cursorId: string) => {
            return (range: any, oldRange: any, source: any) => {
                if (source === "user" && cursorId) {
                    socket.emit("send-cursor-move", range, fileId, cursorId);
                }
            };
        };

        const quillHandler = (delta: any, _oldDelta: any, source: any) => {
            if (source !== "user") return;

            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            setSaving(true);

            const contents = quill.getContents();
            const quillLength = quill.getLength();

            saveTimerRef.current = setTimeout(async () => {
                const updateState = async () => {
                    if (contents && quillLength !== 1 && fileId) {
                        if (dirType == "workspace") {
                            dispatch({
                                type: "UPDATE_WORKSPACE",
                                payload: {
                                    workspace: {
                                        data: JSON.stringify(contents),
                                    },
                                    workspaceId: fileId,
                                },
                            });

                            await updateWorkspace(
                                { data: JSON.stringify(contents) },
                                fileId
                            );
                        } else if (dirType === "folder") {
                            if (!workspaceId) return;

                            dispatch({
                                type: "UPDATE_FOLDER",
                                payload: {
                                    folder: {
                                        data: JSON.stringify(contents),
                                    },
                                    workspaceId,
                                    folderId: fileId,
                                },
                            });

                            await updateFolder(
                                { data: JSON.stringify(contents) },
                                fileId
                            );
                        } else if (dirType === "file") {
                            if (!folderId || !workspaceId) return;

                            dispatch({
                                type: "UPDATE_FILE",
                                payload: {
                                    file: {
                                        data: JSON.stringify(contents),
                                    },
                                    workspaceId,
                                    folderId,
                                    fileId,
                                },
                            });

                            await updateFile(
                                { data: JSON.stringify(contents) },
                                fileId
                            );
                        }
                    }
                };

                await updateState();
                setSaving(false);
            }, 1000);

            socket.emit("send-changes", delta, fileId);
        };

        quill.on("text-change", quillHandler);
        quill.on("selection-change", selectionChangeHandler(user.id));

        // TODO: cursor

        return () => {
            quill.off("text-change", quillHandler);
            quill.off("selection-change", selectionChangeHandler);

            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [
        quill,
        socket,
        fileId,
        user,
        details,
        folderId,
        workspaceId,
        dispatch,
        dirType,
    ]);

    useEffect(() => {
        if (
            quill === null ||
            socket === null ||
            !fileId ||
            !localCursors.length
        )
            return;

        const socketHandler = async (
            range: any,
            roomId: string,
            cursorId: string
        ) => {
            if (roomId == fileId) {
                const cursorToMove = localCursors.find(
                    (c: any) => c.cursors()?.[0].id == cursorId
                );

                if (cursorToMove) {
                    cursorToMove.moveCursor(cursorId, range);
                }
            }
        };
        socket.on("receive-cursor-move", socketHandler);

        return () => {
            socket.off("receive-cursor-move", socketHandler);
        };
    }, [quill, socket, fileId, localCursors]);

    useEffect(() => {
        if (quill === null || socket === null) return;

        const socketHandler = async (deltas: any, id: string) => {
            if (id === fileId) {
                quill.updateContents(deltas);
            }
        };

        socket.on("receive-changes", socketHandler);

        return () => {
            socket.off("receive-changes", socketHandler);
        };
    }, [quill, socket, fileId]);

    useEffect(() => {
        if (!fileId || quill === null) return;

        const room = supabase.channel(fileId);
        const subscription = room
            .on("presence", { event: "sync" }, async () => {
                const newState = room.presenceState();
                const newCollaborators = Object.values(newState).flat() as any;
                setCollaborators(newCollaborators);

                const allCursors: any[] = [];
                if (user) {
                    newCollaborators.forEach(
                        (collaborator: {
                            id: string;
                            email: string;
                            avatar: string;
                        }) => {
                            if (collaborator.id !== user.id) {
                                const userCursor = quill.getModule("cursors");
                                userCursor.createCursor(
                                    collaborator.id,
                                    collaborator.email.split("@")[0],
                                    `#${Math.random().toString(16).slice(2, 8)}`
                                );
                                allCursors.push(userCursor);
                            }
                        }
                    );
                    setLocalCursors(allCursors);
                }
            })
            .subscribe(async (status) => {
                if (status !== "SUBSCRIBED" || !user) return;

                const response = await findUser(user.id);

                if (!response) return;

                room.track({
                    id: user.id,
                    email: user.email?.split("@")[0],
                    avatarUrl:
                        response?.avatarUrl ||
                        getUserAvatar(user.email?.split("@")[0]),
                });
            });
        return () => {
            supabase.removeChannel(room);
        };
    }, [fileId, quill, supabase, user]);

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
                                            {collaborator.email}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                        {isConnected ? (
                            <Badge
                                variant={"outline"}
                                className="bg-green-600 top-4 text-white right-4 z-50"
                            >
                                Connected
                            </Badge>
                        ) : (
                            <Badge
                                variant={"outline"}
                                className="bg-orange-600 top-4 text-white right-4 z-50"
                            >
                                Disconnected
                            </Badge>
                        )}
                        {saving ? (
                            <Badge
                                variant={"outline"}
                                className="bg-orange-600 top-4 text-white right-4 z-50"
                            >
                                Saving...
                            </Badge>
                        ) : (
                            <Badge
                                variant={"outline"}
                                className="bg-green-600 top-4 text-white right-4 z-50"
                            >
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
