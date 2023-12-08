"use client";

import CypressHomeIcon from "../icons/cypressHomeIcon";
import CypressSettingsIcon from "../icons/cypressSettingsIcon";
import CypressTrashIcon from "../icons/cypressTrashIcon";
import { HomeIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";

interface NativeNavigationProps {
    myWorkspaceId: string;
    className?: string;
    getSelectedElement?: (selection: string) => void;
}
const NativeNavigation: React.FC<NativeNavigationProps> = ({
    myWorkspaceId,
    className,
}) => {
    return (
        <div className={twMerge("my-2", className)}>
            <ul className="flex flex-col gap-2">
                <li>
                    <Link
                        className="group/native flex text-Neutrals/neutrals-7 gap-2"
                        href={`dashboard/${myWorkspaceId}`}
                    >
                        <CypressHomeIcon />
                        <span>My Workspace</span>
                    </Link>
                </li>
                <li>
                    <Link
                        className="group/native flex text-Neutrals/neutrals-7 gap-2"
                        href={`dashboard/${myWorkspaceId}`}
                    >
                        <CypressSettingsIcon />
                        <span>Settings</span>
                    </Link>
                </li>
                <li>
                    <Link
                        className="group/native flex text-Neutrals/neutrals-7 gap-2"
                        href={`dashboard/${myWorkspaceId}`}
                    >
                        <CypressTrashIcon />
                        <span>Trash</span>
                    </Link>
                </li>
            </ul>
        </div>
    );
};

export default NativeNavigation;
