import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip";

import React from "react";

interface TooltipComponentProps {
    children: React.ReactNode;
    message: string;
}

const TooltipComponent: React.FC<TooltipComponentProps> = ({
    children,
    message,
}) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>{children}</TooltipTrigger>
                <TooltipContent>{message}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default TooltipComponent;
