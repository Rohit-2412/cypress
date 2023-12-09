import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getUserAvatar = (name: string | null | undefined) => {
    if (!name || name === null || name === undefined)
        return `https://api.dicebear.com/6.x/initials/svg/seed=John`;

    const nameArr = name.split(" ");
    name = nameArr.join("");
    return `https://api.dicebear.com/6.x/initials/svg/seed=${name}`;
};
