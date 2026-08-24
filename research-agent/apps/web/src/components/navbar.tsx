import Link from "next/link";
import { Sparkles, Bot } from "lucide-react";

export function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-calcite-peach/60 text-calcite-charcoal">
                            <Sparkles className="h-4 w-4" />
                        </span>
                        <div className="hidden sm:block">
                            <h1 className="text-base font-bold tracking-[-0.01em] text-foreground">
                                AI Research Agent
                            </h1>
                        </div>
                    </Link>
                    <Link
                        href="/research"
                        className="flex items-center gap-2 rounded-full border border-calcite-light bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <Bot className="h-4 w-4" />
                        My Research
                    </Link>
                </div>
            </div>
        </nav>
    );
}