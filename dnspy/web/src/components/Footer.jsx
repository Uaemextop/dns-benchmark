import { useTranslation } from "react-i18next";
import { Link } from "@nextui-org/react";
import { FaGithub as GithubIcon, FaHeart as HeartIcon } from "react-icons/fa";

/**
 * Minimal footer showing version and links.
 */
export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="w-full py-4 px-6 mt-8 border-t border-default-200/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-default-400">
        <div className="flex items-center gap-1.5">
          <span>DNSPY Dashboard</span>
          <span className="text-default-300">•</span>
          <span className="flex items-center gap-1">
            Made with <HeartIcon className="w-3 h-3 text-red-400" />
          </span>
        </div>
        <Link
          href="https://github.com/xxnuo/dns-benchmark"
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-default-400 hover:text-default-600 transition-colors"
        >
          <GithubIcon className="w-3.5 h-3.5" />
          <span>GitHub</span>
        </Link>
      </div>
    </footer>
  );
}
