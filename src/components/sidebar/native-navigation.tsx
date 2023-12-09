"use client";

import CypressHomeIcon from "../icons/cypressHomeIcon";
import CypressSettingsIcon from "../icons/cypressSettingsIcon";
import CypressTrashIcon from "../icons/cypressTrashIcon";
import { HomeIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import Settings from "../settings/settings";
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
                        className="group/native flex text-Neutrals/neutrals-7 gap-2 cursor-pointer"
                        href={`/dashboard/${myWorkspaceId}`}
                    >
                        <CypressHomeIcon />
                        <span>My Workspace</span>
                    </Link>
                </li>

                <Settings>
                    <li className="group/native flex text-Neutrals/neutrals-7 gap-2 cursor-pointer">
                        <CypressSettingsIcon />
                        <span>Settings</span>
                    </li>
                </Settings>

                <li className="group/native flex text-Neutrals/neutrals-7 gap-2 cursor-pointer">
                    <CypressTrashIcon />
                    <span>Trash</span>
                </li>
            </ul>
        </div>
    );
};

export default NativeNavigation;
