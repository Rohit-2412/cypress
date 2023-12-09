import { Folder, workspace } from "@/lib/supabase/supabase.types";
import {
    appFoldersType,
    appWorkspacesType,
} from "@/lib/providers/state-provider";

import BannerUploadForm from "./banner-upload-form";
import CustomDialogTrigger from "../global/custom-dialog-trigger";
import React from "react";

interface BannerUploadProps {
    children: React.ReactNode;
    className?: string;
    dirType: "workspace" | "file" | "folder";
    id: string;
}

const BannerUpload: React.FC<BannerUploadProps> = ({
    id,
    dirType,
    children,
    className,
}) => {
    return (
        <CustomDialogTrigger
            header="Upload Banner"
            content={<BannerUploadForm dirType={dirType} id={id} />}
            className={className}
        >
            {children}
        </CustomDialogTrigger>
    );
};

export default BannerUpload;
