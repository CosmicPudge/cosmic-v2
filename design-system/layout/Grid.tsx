"use client";

import type { ReactNode } from "react";

export default function Grid({
children,
}:{
children:ReactNode;
}){

return(

<div
className="

grid

grid-cols-1

md:grid-cols-6

xl:grid-cols-12

gap-6

"

>

{children}

</div>

);

}