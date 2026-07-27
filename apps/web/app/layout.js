import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });
export const metadata = {
    title: "Agent Knowledge Graph Lab",
    description: "Research environment for typed knowledge graph agent retrieval",
};
export default function RootLayout({ children, }) {
    return (<html lang="en">
      <body className={inter.className}>{children}</body>
    </html>);
}
//# sourceMappingURL=layout.js.map