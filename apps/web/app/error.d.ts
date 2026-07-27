export default function ErrorPage({ error, reset, }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}): import("react").JSX.Element;
//# sourceMappingURL=error.d.ts.map