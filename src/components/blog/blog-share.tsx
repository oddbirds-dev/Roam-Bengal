import { FacebookShareButton, TwitterShareButton, LinkedinShareButton, WhatsappShareButton, TelegramShareButton, EmailShareButton } from "react-share";
import { FacebookIcon, TwitterIcon, LinkedinIcon, WhatsappIcon, TelegramIcon, EmailIcon } from "react-share";

export function BlogShare({ url, title }: { url: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[0.8rem] font-bold text-ink">Share on:</span>
      <div className="flex items-center gap-1.5">
        <FacebookShareButton url={url} title={title}>
          <FacebookIcon size={24} round />
        </FacebookShareButton>
        
        <TwitterShareButton url={url} title={title}>
          <TwitterIcon size={24} round />
        </TwitterShareButton>

        <LinkedinShareButton url={url} title={title}>
          <LinkedinIcon size={24} round />
        </LinkedinShareButton>

        <WhatsappShareButton url={url} title={title}>
          <WhatsappIcon size={24} round />
        </WhatsappShareButton>
        
        <TelegramShareButton url={url} title={title}>
          <TelegramIcon size={24} round />
        </TelegramShareButton>

        <EmailShareButton url={url} subject={title} body="Check out this article!">
          <EmailIcon size={24} round />
        </EmailShareButton>
      </div>
    </div>
  );
}
