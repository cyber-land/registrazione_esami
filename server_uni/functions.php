<?php

use Firebase\JWT\JWT;

function status()
{
	return array('status' => 'online');
}

function getToken($data): string
{
	$secretKey = JWT_SECRET;
	$tokenId = "";
	try {
		$tokenId = base64_encode(random_bytes(16));
	} catch (Exception $e) {
	}
	$serverName = 'server_name.com';
	$issuedAt = new DateTimeImmutable();
	$expire = $issuedAt->modify('+2 minutes')->getTimestamp();
	$data = [
		'iat' => $issuedAt->getTimestamp(),    // Issued at: time when the token was generated
		'jti' => $tokenId,                     // Json Token Id: a unique identifier for the token
		'iss' => $serverName,                  // Issuer
		'nbf' => $issuedAt->getTimestamp(),    // Not before
		'exp' => $expire,                      // Expire
		'data' => $data
	];
	return JWT::encode($data, $secretKey, 'HS512');
}

function authentication(string $username, string $password): ?string
{
	global $pdo;
	$sql = 'SELECT * FROM professore WHERE username = :username';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['username' => $username]);
	$user = $stmt->fetch();
	// controlla se l'utente esiste e se la password corrisponde all'hash
	if ($user === false || !password_verify($password, $user['password']))
		return null;
	$data = array('id' => $user['id'], 'surname' => $user['cognome'], 'name' => $user['nome'], 'username' => $username);
	return getToken($data);
}

function is_correct($test): array
{
	global $pdo;
	//le note non sono da controllare

	//controllare che lo stato sia tra le 3 possibilità
	$possibili_stati = array('accettato', 'rifiutato', 'ritirato');
	if (!in_array($test->{'stato'}, $possibili_stati)) {
		return array(false, 'stato non valido');
	}
	//controllare se id_studente, id_esame ed id_professore sono validi
	$sql = 'select * from studente where id = :id_studente';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['id_studente' => $test->{'id_studente'}]);
	$res = $stmt->fetchAll();
	if (!$res) return array(false, 'id_studente non valido');
	$sql = 'select * from professore where id = :id_professore';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['id_professore' => $test->{'id_professore'}]);
	$res = $stmt->fetchAll();
	if (!$res) return array(false, 'id_professore non valido');
	$sql = 'select * from esame where id = :id_esame';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['id_esame' => $test->{'id_esame'}]);
	$res = $stmt->fetchAll();
	if (!$res) return array(false, 'id_esame non valido');

	//controllare che l'esame attuale sia in una data successiva o uguale rispetto all'ultima prova
	$sql = 'select data, if (data > (select data from esame where id = :id_esame), true, false) as result 
from prova, esame where esame.id = prova.id_esame and id_studente = :id_studente order by data desc limit 1';
	$stmt = $pdo->prepare($sql);
	$stmt->execute([
		'id_esame' => $test->{'id_esame'},
		'id_studente' => $test->{'id_studente'}
	]);
	$res = $stmt->fetchAll();
	if ($res[0]['result']) return array(false, 'data non valida (precedente all\'ultima prova eseguita)');

	//controllo sulla correttezza della tipologia e valutazione
	$tipologia = $test->{'tipologia'};
	$valutazione = $test->{'valutazione'};
	if ($tipologia == 'teoria' && $valutazione <= 15) {
		$sql = 'select * from prova where id_studente = :id_studente and valutazione >= 8 and stato = "accettato" order by id desc limit 1';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id_studente' => $test->{'id_studente'}]);
		$result = $stmt->fetchAll();
		if (!$result || $result[0]['tipologia'] == 'teoria') {
			return array(true);
		}
		return array(false, 'tipologia non valida (la teoria deve essere la prima prova o deve essere preceduta da un altro esame di teoria)');
	} elseif ($tipologia == 'programmazione' && $valutazione <= 17) {
		//se l'ultima prova valida è orale ritorna false
		$sql = 'select * from prova where id_studente = :id_studente and stato = "accettato" order by id desc';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id_studente' => $test->{'id_studente'}]);
		$result = $stmt->fetchAll();
		//var_dump($result);
		if (!$result || $result[0]['tipologia'] == 'orale') {
			return array(false, 'tipologia non valida (non si può fare nessun ulteriore esame dopo l\'orale)');
		}
		//controlla se l'ultima valida è programmazione, controllando se ce ne sono più di una
		$sql = 'select * from prova where id_studente = :id_studente order by id desc';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id_studente' => $test->{'id_studente'}]);
		$result = $stmt->fetchAll();
		var_dump($result[0]['tipologia']);
		if ($result[0]['tipologia'] == 'programmazione') {
			$sql = 'select * from prova where id_studente = :id_studente and stato = "accettato" and tipologia = "programmazione" order by id desc';
			$stmt = $pdo->prepare($sql);
			$stmt->execute(['id_studente' => $test->{'id_studente'}]);
			$result = $stmt->fetchAll();
			echo sizeof($result);
			if (sizeof($result) <= 2)
				return array(true);
			else
				return array(false, 'tipologia non valida (dopo due tentativi falliti della seconda prova bisogna obbligatoriamente rifare la prima)');
		}
		//controlla che l'ultima prova valida sia teoria
		$sql = 'select * from prova where id_studente = :id_studente and stato = "accettato" order by id desc';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id_studente' => $test->{'id_studente'}]);
		$result = $stmt->fetchAll();
		if (!$result) return array(false, 'tipologia non valida (la programmazione deve essere preceduta da un valido esame di teoria)');
		if ($result[0]['tipologia'] == 'teoria') {
			return array(true);
		} else {
			return array(false, "unreachable");
		}
	} elseif ($tipologia == 'orale' && $valutazione >= -3 && $valutazione <= 3) {
		//non viene controllato lo stato siccome l'orare non può essere rifiutato e lo studente non può ritirarsi
		$sql = 'select * from prova where id_studente = :id_studente order by id desc limit 1';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id_studente' => $test->{'id_studente'}]);
		$result = $stmt->fetchAll();
		if ($result[0]['tipologia'] == 'programmazione') {
			return array(true);
		}
		return array(false, 'tipologia non valida (l\'orale deve essere obbligatoriamente preceduto da un valido esame di programmazione)');
	} else {
		return array(false, 'error (non esiste una tipologia con questo nome oppure la valutazione è superiore al massimo consentito)');
	}
	return array(false, 'unreachable');
}
