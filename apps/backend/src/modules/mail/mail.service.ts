import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Readable } from 'stream';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: {
      filename: string;
      content?: Buffer | string | Readable;
      path?: string;
      contentType?: string;
    }[],
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
        attachments,
      });
      this.logger.log(`Email sent to ${to} | Subject: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      // In production, you might want to throw or handle this differently (e.g. retry queue)
      // For now, logging error is enough.
      return false;
    }
  }

  async sendWithdrawalPackage(
    to: string,
    athleteName: string,
    clubName: string,
    attachments: { filename: string; content: Buffer | string }[],
  ) {
    const subject = `Rescisão e Documentação de Atleta - ${athleteName}`;
    const html = `
      <p>Exmos. Senhores,</p>

      <p>Vimos por este meio enviar a documentação referente à rescisão do atleta <strong>${athleteName}</strong> com o clube <strong>${clubName}</strong>.</p>
      
      <p>Em anexo:</p>
      <ul>
        <li>Carta de Desvinculação</li>
        <li>Exame Médico Desportivo (se aplicável)</li>
      </ul>

      <br>
      <p>Com os melhores cumprimentos,</p>
      <p>A Direção do ${clubName}</p>
    `;

    // Note: attachments content can be a path, stream, or buffer.
    // In our case, we might be passing URLs or file paths.
    // If we are passing URLs from upload, we might need to fetch them or pass as path if local.
    // Assuming for now generic implementation.

    // Fix: If content is a URL string starting with 'http' or '/', usually nodemailer expects 'path' property for file location
    // or 'href' for URL. But since we use simple content string in mock, let's adapt.
    const formattedAttachments = attachments.map((att) => {
      if (
        typeof att.content === 'string' &&
        (att.content.startsWith('http') || att.content.startsWith('/'))
      ) {
        return {
          filename: att.filename,
          path: att.content, // Use 'path' for file paths/URLs
        };
      }
      return att;
    });

    return this.sendEmail(to, subject, html, formattedAttachments);
  }
}
