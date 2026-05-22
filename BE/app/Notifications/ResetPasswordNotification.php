<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{

    public function __construct(
        public readonly string $token
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontend = rtrim(config('app.frontend_url', config('app.url')), '/');
        $email = urlencode($notifiable->getEmailForPasswordReset());
        $url = "{$frontend}/#/reset-password?token={$this->token}&email={$email}";

        return (new MailMessage)
            ->subject('Reset your password — '.config('app.name'))
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset password', $url)
            ->line('This link expires in '.config('auth.passwords.users.expire').' minutes.')
            ->line('If you did not request a password reset, no further action is required.');
    }
}
