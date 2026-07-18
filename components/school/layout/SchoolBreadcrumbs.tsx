interface SchoolBreadcrumbsProps {
  currentPage: string;
}

export function SchoolBreadcrumbs({ currentPage }: SchoolBreadcrumbsProps) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/45">
      School <span className="px-1.5 text-white/25">/</span> {currentPage}
    </p>
  );
}

export default SchoolBreadcrumbs;
