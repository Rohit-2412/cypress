"use client";

import { Alert, AlertDescription } from "../ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Briefcase, Lock, Plus, Share } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { User, workspace } from "@/lib/supabase/supabase.types";
import {
    addCollaborators,
    deleteWorkspace,
    getCollaborators,
    removeCollaborators,
    updateWorkspace,
} from "@/lib/supabase/queries";

import { Button } from "../ui/button";
import CollaboratorSearch from "../global/collaborator-search";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getUserAvatar } from "@/lib/utils";
import { useAppState } from "@/lib/providers/state-provider";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { useToast } from "../ui/use-toast";
import { v4 } from "uuid";

const SettingsForm = () => {
    const router = useRouter();
    const { toast } = useToast();
    const { user, subscription } = useSupabaseUser();
    const supabase = createClientComponentClient();

    const { state, workspaceId, dispatch } = useAppState();
    const [permissions, setPermissions] = useState("private");
    const [collaborators, setCollaborators] = useState<User[] | []>([]);
    const [openAlertMessage, setOpenAlertMessage] = useState(false);
    const [workspaceDetails, setWorkspaceDetails] = useState<workspace>();
    const titleTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const [uploadingProfilePicture, setUploadingProfilePicture] =
        useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Payment portal

    // add collaborators
    const addCollaborator = async (profile: User) => {
        if (!workspaceId) return;
        // if (subscription?.status !== "active" && collaborators.length >= 2) {
        //     setOpen(true);
        //     return;
        // }
        await addCollaborators([profile], workspaceId);
        setCollaborators([...collaborators, profile]);
    };

    // remove collaborators
    const removeCollaborator = async (user: User) => {
        if (!workspaceId) return;
        if (collaborators.length === 1) {
            setPermissions("private");
        }
        await removeCollaborators([user], workspaceId);
        setCollaborators(
            collaborators.filter((collaborator) => collaborator.id !== user.id)
        );
        router.refresh();
    };

    // save changes
    // on change workspace title
    const workspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!workspaceId || !e.target.value) return;

        dispatch({
            type: "UPDATE_WORKSPACE",
            payload: {
                workspace: { title: e.target.value },
                workspaceId,
            },
        });

        if (titleTimerRef.current) clearTimeout(titleTimerRef.current);

        titleTimerRef.current = setTimeout(async () => {
            updateWorkspace({ title: e.target.value }, workspaceId);
        }, 500);
    };

    const onChangeWorkspaceLogo = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (!workspaceId) return;

        const targetFile = e.target.files?.[0];

        if (!targetFile) return;

        const uuid = v4();
        setUploadingLogo(true);
        let filePath = null;
        if (targetFile) {
            try {
                const { data, error } = await supabase.storage
                    .from("workspace-logos")
                    .upload(`workspaceLogo.${uuid}`, targetFile, {
                        cacheControl: "3600",
                        upsert: true,
                    });
                if (error) throw new Error("");

                filePath = data.path;

                if (!error) {
                    dispatch({
                        type: "UPDATE_WORKSPACE",
                        payload: {
                            workspace: { logo: filePath },
                            workspaceId,
                        },
                    });

                    await updateWorkspace({ logo: filePath }, workspaceId);
                }
            } catch (error) {
                console.log("Error", error);
                toast({
                    variant: "destructive",
                    title: "Error! Could not upload your workspace logo",
                });
            } finally {
                setUploadingLogo(false);
            }
        }
    };
    // onclick

    // fetching avatar details

    // get workspace details

    // get all collaborators

    // TODO: Payment portal redirect

    useEffect(() => {
        if (!workspaceId) return;

        const visibleWorkspace = state.workspaces.find(
            (workspace) => workspace.id === workspaceId
        );
        if (visibleWorkspace) {
            setWorkspaceDetails(visibleWorkspace);
        }
    }, [state, workspaceId]);

    useEffect(() => {
        if (!workspaceId) return;

        const fetchCollaborators = async () => {
            const response = await getCollaborators(workspaceId);

            if (response.length) {
                console.log("shared work space");
                setPermissions("shared");
                setCollaborators(response);
            }
        };

        fetchCollaborators();
    }, []);

    const onClickAlertConfirm = async () => {
        if (!workspaceId) return;
        if (collaborators.length > 0) {
            await removeCollaborators(collaborators, workspaceId);
        }
        setPermissions("private");
        setOpenAlertMessage(false);
    };

    const onPermissionsChange = (val: string) => {
        if (val === "private") {
            setOpenAlertMessage(true);
        } else setPermissions(val);
    };
    return (
        <div className="flex flex-col gap-4">
            <p className="flex items-center gap-2 mt-6">
                <Briefcase size={20} />
                Workspace
            </p>
            <Separator />
            <div className="flex flex-col gap-2">
                <Label
                    htmlFor="workspaceName"
                    className="text-sm text-muted-foreground"
                >
                    Name
                </Label>
                <Input
                    name="workspaceName"
                    value={workspaceDetails ? workspaceDetails.title : ""}
                    placeholder="Workspace Name"
                    onChange={workspaceNameChange}
                />
                <Label
                    htmlFor="workspaceLogo"
                    className="text-sm text-muted-foreground"
                >
                    Workspace Logo
                </Label>
                <Input
                    name="workspaceLogo"
                    type="file"
                    accept="image/*"
                    placeholder="Workspace Logo"
                    onChange={onChangeWorkspaceLogo}
                    disabled={
                        uploadingLogo || subscription?.status !== "active"
                    }
                />
                {subscription?.status !== "active" && (
                    <small className="text-muted-foreground">
                        To customize your workspace, you need to be on a Pro
                        Plan
                    </small>
                )}

                <>
                    <Label
                        htmlFor="permissions"
                        className="text-sm text-muted-foreground"
                    >
                        Permission
                    </Label>
                    <Select
                        onValueChange={onPermissionsChange}
                        value={permissions}
                    >
                        <SelectTrigger className="w-full h-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="private">
                                    <div className="p-2 flex gap-4 justify-center items-center">
                                        <Lock />
                                        <article className="text-left flex flex-col">
                                            <span>Private</span>
                                            <p>
                                                Your workspace is private to
                                                you. You can choose to share it
                                                later.
                                            </p>
                                        </article>
                                    </div>
                                </SelectItem>
                                <SelectItem value="shared">
                                    <div className="p-2 flex gap-4 justify-center items-center">
                                        <Share />
                                        <article className="text-left flex flex-col">
                                            <span>Shared</span>
                                            <span>
                                                You can invite collaborators.
                                            </span>
                                        </article>
                                    </div>
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </>
                {permissions === "shared" && (
                    <div>
                        <CollaboratorSearch
                            existingCollaborators={collaborators}
                            getCollaborator={(user) => {
                                addCollaborator(user);
                            }}
                        >
                            <Button type="button" className="text-sm mt-4">
                                <Plus />
                                Add Collaborators
                            </Button>
                        </CollaboratorSearch>
                        <div className="mt-4">
                            <span className="text-sm text-muted-foreground">
                                Collaborators {collaborators.length || ""}
                            </span>
                            <ScrollArea className="h-[160px] overflow-y-scroll w-full rounded-md border border-muted-foreground/20">
                                {collaborators.length ? (
                                    collaborators.map((c) => (
                                        <div
                                            className="p-4 flex justify-between items-center"
                                            key={c.id}
                                        >
                                            <div className="flex gap-4 items-center">
                                                <Avatar>
                                                    <AvatarImage
                                                        src={getUserAvatar(
                                                            c?.email
                                                        )}
                                                    />
                                                    <AvatarFallback>
                                                        PJ
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="text-sm gap-2 text-muted-foreground overflow-hidden overflow-ellipsis sm:w-[300px] w-[140px]">
                                                    {c.email}
                                                </div>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                onClick={() =>
                                                    removeCollaborator(c)
                                                }
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="absolute   right-0 left-0   top-0   bottom-0   flex   justify-center   items-center ">
                                        <span className="text-muted-foreground text-sm">
                                            You have no collaborators
                                        </span>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                )}

                <Alert variant={"destructive"}>
                    <AlertDescription>
                        Warning! deleting you workspace will permanently delete
                        all data related to this workspace.
                    </AlertDescription>
                    <Button
                        type="submit"
                        size={"sm"}
                        variant={"destructive"}
                        className="mt-4 text-sm bg-destructive/40  border-2 border-destructive"
                        onClick={async () => {
                            if (!workspaceId) return;
                            await deleteWorkspace(workspaceId);
                            toast({
                                title: "Successfully deleted your workspace",
                            });
                            dispatch({
                                type: "DELETE_WORKSPACE",
                                payload: workspaceId,
                            });
                            router.replace("/dashboard");
                        }}
                    >
                        Delete Workspace
                    </Button>
                </Alert>
            </div>

            <AlertDialog open={openAlertMessage}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDescription>
                            Changing a Shared workspace to a Private workspace
                            will remove all collaborators permanently.
                        </AlertDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setOpenAlertMessage(false)}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={onClickAlertConfirm}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SettingsForm;
