#!/bin/bash

#########################################
# Counters
#########################################

CREATED=0
SKIPPED=0

COMPONENTS=0
WIDGETS=0
WINDOWS=0
NEXTFILES=0
TYPESCRIPT=0
STYLES=0

#########################################
# Internal Helpers
#########################################

create_file() {

    FILE="$1"

    if [ -f "$FILE" ]; then
        echo "⏭  $FILE"
        ((SKIPPED++))
        return 1
    fi

    mkdir -p "$(dirname "$FILE")"

    return 0
}

pascal_case() {

    NAME=$(basename "$1")
    NAME="${NAME%.*}"

    echo "$NAME" \
    | sed 's/[-_]/ /g' \
    | awk '{
        for(i=1;i<=NF;i++)
            $i=toupper(substr($i,1,1)) substr($i,2)
        print
    }' \
    | tr -d ' '
}

#########################################
# React Component
#########################################

create_component() {

    FILE="$1"

    create_file "$FILE" || return

    NAME=$(pascal_case "$FILE")

cat > "$FILE" <<EOF
"use client";

export default function ${NAME}() {
    return (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold">${NAME}</h2>
        </div>
    );
}
EOF

    echo "✅ $FILE"

    ((CREATED++))
    ((COMPONENTS++))
}

#########################################
# Widget
#########################################

create_widget() {

    FILE="$1"

    create_file "$FILE" || return

    NAME=$(pascal_case "$FILE")
    TITLE="${NAME%Widget}"

cat > "$FILE" <<EOF
"use client";

export default function ${NAME}() {
    return (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">${TITLE}</h2>

            <p className="mt-3 text-white/50">
                Placeholder Widget
            </p>
        </section>
    );
}
EOF

    echo "✅ $FILE"

    ((CREATED++))
    ((WIDGETS++))
}

#########################################
# Window
#########################################

create_window() {

    FILE="$1"

    create_file "$FILE" || return

    NAME=$(pascal_case "$FILE")
    TITLE="${NAME%Window}"

cat > "$FILE" <<EOF
"use client";

export default function ${NAME}() {
    return (
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 backdrop-blur-xl">
            <h1 className="text-2xl font-bold">
                ${TITLE}
            </h1>
        </div>
    );
}
EOF

    echo "✅ $FILE"

    ((CREATED++))
    ((WINDOWS++))
}

increment() {
    local var="$1"
    eval "$var=\$(( $var + 1 ))"
}