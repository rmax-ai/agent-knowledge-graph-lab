export default function GlobalErrorPage({ error, reset, }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}): import("react").JSX.Element;
//# sourceMappingURL=global-error.d.ts.map