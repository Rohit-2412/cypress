import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createOrRetrieveCustomer } from "@/lib/stripe/adminTasks";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getURL } from "@/lib/utils";
import { stripe } from "@/lib/stripe";
export async function POST() {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("could not find the user");

        const customer = await createOrRetrieveCustomer({
            email: user.email || "",
            uuid: user.id || "",
        });

        if (!customer) throw new Error("No Customer");
        const { url } = await stripe.billingPortal.sessions.create({
            customer,
            return_url: `${getURL()}/dashboard`,
        });
        return NextResponse.json({ url });
    } catch (error) {
        console.log("ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
