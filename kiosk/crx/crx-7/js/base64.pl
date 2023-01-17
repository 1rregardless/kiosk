#!/usr/bin/perl
use warnings;
use MIME::Base64;
use Crypt::Blowfish;

my $encoded = 'A/vzVHeJNKLzwdSftrnx/xb0fei6z7reKQvxD1JzMRsNBfFJPdEqG8GeUhKzU9rR7nUZaW4oAkFUEjR8z78IYM8C+bpzg9YC5JG8DKZncOv1uTuHd5qF/5ppm4DjZZUXVDEvD+F0rD/xpc3eaQtHwTJJoMF0Id/09b1/gEIY6/oUcXec4PUkkRT9FzGLMxSOI5tiNO92U/3EX3Qbd3+IH0+hk6F7jIRQ9QoPJLjLFrxJQdJchymejzNJLej0stdCPsAWA63lsxmL0URSTevSfuA6dAPT92QySvDiCyzZKEOvBBP5fXuW65mYnrsPI4hY7O0/T2/xjuczPTKG+wsEcyZcSZv/DVqV2kG8qmuGnFf4wxL+JZmwl9efD9RnbaQgCmqXagcwJmJDQLDYhwMGzgL5Z/kBLtWg/SQ1pN6qf6tlbinbatzRYGJMr6vcuVjaskAqgxRPkTdaFeBvai76+WmSfH9QrPfbT2HXzzqPgNQPKb1R69Xg5H/228zdNRd5OklWbL3ilJRRvGzGbMU1rpKofXsUNPon39DAK3THauw0Jz+tmk7MiTIbM3kXGLfxElXOCMxKhf16465zkHyN5AqNNjP6lbqkicWf83VDurwxZpFkPs/Y7bN4GRPW3x8Mzpi8pX9El6nXPYerTdv59wh+UncrDiXskSRrGXyieB7lw+MqvqX1RnlOGUA7WnuRkzHTbWjeTiUc5EkielaHhFLU7LTV2FzWsZG03f9444+jDOhyPaBmrdNQ73Njko2ojlNRUTV6Et8k1LEDKBQiwOWOtVZEst140zn0f8j/KwEpVOZNl9zlAfV6bUpl7baW+zImuh0lWndZ4lE6wb1kURXhc6KH5I4ppIo5YqKJtpNLnLoyGBW2gzI1wQtSCzj9CMUWbLxIXPflF8gX2IagQZ6OkzloDHNjuEQiC67ADu4JgRH1Z7N24XkrBjNG1bnYOGtd2PZZSIlv62oG+0QPQfbcRO8Sgfu2xb+toGn3xCU=';
my $decoded = decode_base64($encoded);




my $key = 'jhh7NCQ4P0mBbkTQ';
my $cipher = Crypt::Blowfish->new($key);

my $pt="";
while (length($decoded) > 0) {
	my $decoded8 = substr($decoded, 0, 8);
	$decoded = substr($decoded, 8);
	
	$pt .= $cipher->decrypt($decoded8);

}

my $filename = 'report.txt';
open(my $fh, '>', $filename) or die "Could not open file '$filename' $!";
print $fh $pt;
close $fh;

print "\n", "\n", $pt,"\n";