import { TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

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
            <TooltipTrigger>{children}</TooltipTrigger>
            <TooltipContent>{message}</TooltipContent>
        </TooltipProvider>
    );
};

export default TooltipComponent;
