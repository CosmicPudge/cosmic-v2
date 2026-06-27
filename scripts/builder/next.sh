#!/bin/bash

#########################################
# Next.js Generators
#########################################

create_page() {

    FILE="$1"

    create_file "$FILE" || return

cat > "$FILE" <<EOF
export default function Page() {
    return (
        <main className="min-h-screen">
            Page
        </main>
    );
}
EOF

    echo "✅ $FILE"

    ((CREATED++))
    ((NEXTFILES++))
}

#########################################

create_layout() {

    FILE="$1"

    create_file "$FILE" || return

cat > "$FILE" <<EOF
import type { ReactNode } from "react";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({
    children,
}: LayoutProps) {
    return <>{children}</>;
}
EOF

    echo "✅ $FILE"

    ((CREATED++))
    ((NEXTFILES++))
}

#########################################

create_loading() {

    FILE="$1"

    create_file "$FILE" || return

cat > "$FILE" <<EOF
export default function Loading() {
    return (
        <div className="flex h-screen items-center justify-center">
            Loading...
        </div>
    );
}
EOF

    echo "✅ $FILE"

    ((CREATED++))
    ((NEXTFILES++))
}

#########################################

create_error() {

    FILE="$1"

    create_file "$FILE" || return

cat > "$FILE" <<EOF
"use client";

export default function Error({
    error,
    reset,
}: {
    error: Error;
    reset: () => void;
}) {

    console.error(error);

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">

            <h1 className="text-3xl font-bold">
                Something went wrong
            </h1>

            <button
                onClick={reset}
                className="rounded-lg bg-blue-600 px-4 py-2"
            >
                Try Again
            </button>

        </div>
    );
}
EOF

    echo "✅ $FILE"

    ((CREATED++))
    ((NEXTFILES++))
}

#########################################

create_not_found() {

    FILE="$1"

    create_file "$FILE" || return

cat > "$FILE" <<EOF
export default function NotFound() {
    return (
        <div className="flex h-screen items-center justify-center">
            <h1 className="text-3xl font-bold">
                404 | Page Not Found
            </h1>
        </div>
    );
}
EOF

    echo "✅ $FILE"

    ((CREATED++))
    ((NEXTFILES++))
}

#########################################

create_route() {

    FILE="$1"

    create_file "$FILE" || return

cat > "$FILE" <<EOF
import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        status: "ok",
    });
}
EOF

    echo "✅ $FILE"

    ((CREATED++))
    ((NEXTFILES++))
}

#########################################
# Build App Routes
#########################################

build_next() {

    create_layout app/os/layout.tsx

    create_page app/os/page.tsx

    create_loading app/os/loading.tsx

    create_not_found app/os/not-found.tsx

    create_error app/os/error.tsx

}