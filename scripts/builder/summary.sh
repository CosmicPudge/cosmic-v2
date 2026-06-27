#!/bin/bash

print_summary() {

echo ""
echo "========================================="
echo "🚀 Cosmic Builder Complete"
echo "========================================="
echo ""

printf "%-18s %5d\n" "Components:" "$COMPONENTS"
printf "%-18s %5d\n" "Widgets:" "$WIDGETS"
printf "%-18s %5d\n" "Windows:" "$WINDOWS"
printf "%-18s %5d\n" "Next Files:" "$NEXTFILES"
printf "%-18s %5d\n" "TypeScript:" "$TYPESCRIPT"
printf "%-18s %5d\n" "Styles:" "$STYLES"

echo ""

printf "%-18s %5d\n" "Created:" "$CREATED"
printf "%-18s %5d\n" "Skipped:" "$SKIPPED"

echo ""
echo "✨ Cosmic OS scaffold is ready."
echo ""

}