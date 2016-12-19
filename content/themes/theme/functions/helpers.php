<?

function plural($number, $one, $two, $five) {
	if (($number - $number % 10) % 100 != 10) {
		if ($number % 10 == 1) {
			$result = $one;
		} elseif ($number % 10 >= 2 && $number % 10 <= 4) {
			$result = $two;
		} else {
			$result = $five;
		}
	} else {
		$result = $five;
	}
	return $result;
}
