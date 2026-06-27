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
