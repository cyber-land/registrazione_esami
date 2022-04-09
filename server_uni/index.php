<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Exception\HttpNotFoundException;
use Tuupola\Middleware\JwtAuthentication;
use Firebase\JWT\JWT;

require __DIR__ . '/vendor/autoload.php';
$app = AppFactory::create();
$app->setBasePath("/server_uni"); //"/RegistrazioneEsami/registrazione_esami/server_uni"

//impostare manualmente il file, siccome non può venire inserito nello storico di git
$data = file_get_contents('config.json');
$obj = json_decode($data, true);
$pdo = new PDO(
	"mysql:{$obj['DB_HOST']}={$obj['DM_ADDR']};{$obj['DM_NAME']}={$obj['DB_NAME']}",
	$obj['DB_USER']
);

//TODO: fare i controlli sull'input (verificare che i valori corrispondenti ad altre tabelle esistano)
// della POST /tests e PUT /tests/id
//TODO: controllare che l'id sia un numero (esclusi i non validi)
//TODO: definire gli statuscode di ritorno lato server poi gestirli lato client

define('JWT_SECRET', (string)$obj['JWT_SECRET']);

//bypass CORS
$app->options('/{routes:.+}', function ($request, $response, $args) {
	return $response;
});

//bypass CORS
$app->add(function ($request, $handler) {
	$response = $handler->handle($request);
	return $response
		->withHeader('Access-Control-Allow-Origin', 'http://mysite')
		->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
		->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

//eliminare l'accesso ai percorsi che non hanno un token valido nel l'header
$app->add(
	new JwtAuthentication([
		"path" => "/server_uni",
		"ignore" => ["/server_uni/auth"],
		"secret" => JWT_SECRET
	])
);

function getToken($data): string
{
	$secretKey = JWT_SECRET;
	$tokenId = "";
	try {
		$tokenId = base64_encode(random_bytes(16));
	} catch (Exception $e) {}
	$serverName = 'server_name.com';
	$issuedAt = new DateTimeImmutable();
	$expire = $issuedAt->modify('+5 minutes')->getTimestamp();
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

//TODO: muovere in un altro file
function authentication(string $username, string $password): ?string
{
	global $pdo;
	$sql = 'SELECT id, password FROM professore WHERE username = :username';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['username' => $username]);
	$user = $stmt->fetch();
	// controlla se l'utente esiste e se la password corrisponde all'hash
	if ($user === false || !password_verify($password, $user['password']))
		return null;
	$data = array('id' => $user['id'], 'username' => $username);
	return getToken($data);
}

$app->get('/renew_token', function (Request $request, Response $response, array $args) {
	//se il token è corretto ritorna un nuovo token con gli stessi dati
	//altrimenti ritorna un errore
	$jwt = $request->getAttribute("token");
	//var_dump($jwt);
	//$tokenDecoded = JWT::decode($jwt, JWT_SECRET);
	//$d = $jwt['data']->{'username'};
	$data = array('id' => $jwt['data']->{'id'}, 'username' => $jwt['data']->{'username'});
	//var_dump($d);
	$jwt = getToken($data);
	if ($jwt !== null) {
		$json = array('jwt' => $jwt);
		$response->getBody()->write(json_encode($json));
	}
	return $response->withHeader('Content-Type', 'application/json');
});

//shadow /students/{id}
$app->get('/students/{matricola}', function (Request $request, Response $response, array $args) use ($pdo) {
	$matricola = $args['matricola']; //TODO: controllo di validità
	$sql = 'select studente.id, nome, cognome, matricola, id_corso, voto, descrizione as corso 
						from studente, corso where matricola=:matricola and corso.id = studente.id_corso';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['matricola' => $matricola]);
	$result = $stmt->fetchAll();
	$response->getBody()->write(json_encode($result));
	return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/students/{id}/tests', function (Request $request, Response $response, array $args) use ($pdo) {
	$sql = 'select * from prova, esame where id_esame = esame.id 
						and id_studente = :id order by esame.data desc, prova.id desc';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['id' => $args['id']]);
	$result = $stmt->fetchAll();
	$response->getBody()->write(json_encode($result));
	return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/{table}', function (Request $request, Response $response, array $args) use ($pdo) {
	$table = $args['table'];
	$tables = array('students' => 'studente', 'courses' => 'corso', 'tests' => 'prova', 'exams' => 'esame');
	if (array_key_exists($table, $tables)) {
		$sql = 'select * from ' . $tables[$table] . ' order by id desc';
		$stmt = $pdo->prepare($sql);
		$stmt->execute();
		$result = $stmt->fetchAll();
		$response->getBody()->write(json_encode($result));
	} elseif ($table == 'teachers') {
		$sql = 'select id, nome, cognome, username from professore order by id desc';
		$stmt = $pdo->prepare($sql);
		$stmt->execute();
		$result = $stmt->fetchAll();
		$response->getBody()->write(json_encode($result));
	} else {
		$response->getBody()->write(json_encode("invalid table name: " . $table));
	}
	return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/{table}/{id}', function (Request $request, Response $response, array $args) use ($pdo) {
	$table = $args['table'];
	$tables = array('students' => 'studente', 'courses' => 'corso', 'tests' => 'prova', 'exams' => 'esame');
	if (array_key_exists($table, $tables)) {
		$sql = 'select * from ' . $tables[$table] . ' where id=:id';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id' => $args['id']]);
		$result = $stmt->fetchAll();
		$response->getBody()->write(json_encode($result));
	} elseif ($table == 'teachers') {
		$sql = 'select id, nome, cognome, username from professore where id=:id';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id' => $args['id']]);
		$result = $stmt->fetchAll();
		$response->getBody()->write(json_encode($result));
	} else {
		$response->getBody()->write(json_encode("invalid table name: " . $table));
	}
	return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/exams/{id}/pdf', function (Request $request, Response $response, $args) use ($pdo) {
	/* matricola, cognome(3), nome(3), voto teoria, voto programmazione, totale, note
	i voti possono essere:
	- numero (se eseguito e sufficiente)
	- INSUFF (se insufficiente)
	- vuoto (se fatto in esami precedenti o non ancora svolto)
	*/
	//note può essere:
	// - orale obbligatorio (se totale è 16 o 17)
	// - da rifare la teoria (se ci sono due insuff della 2°)

	//dato l'esame in questione, recuperare tutte le prove collegate e gli studenti collegati ad esse
	//il risultato finale è una mappa (dati dello studente : voti delle sue prove)
	/*
		try {
			$sql = 'select * from prova, esame where id_esame = esame.id';
			$stmt = $pdo->prepare($sql);
			$stmt->execute(['id' => $args['id']]);
			$result = $stmt->fetchAll();
			$response->getBody()->write(json_encode($result));
		} catch (Exception $e) {echo $e->getMessage();}
	*/
	$data = "pdf";
	$response->getBody()->write(json_encode($data));
	return $response;
});

$app->post('/students', function (Request $request, Response $response, $args) use ($pdo) {
	// {"matricola": "0012", "nome": "luca", "cognome": "mandolini", "voto": null, "corso": "informatica"}
	$body = $request->getBody();
	$value = json_decode($body);
	// controllare se uno studente con la stessa matricola esiste già
	$sql = 'SELECT * FROM studente WHERE matricola = :matricola';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['matricola' => $value->{'matricola'}]);
	$matricola = $stmt->fetchAll();
	//var_dump($matricola);
	if ($matricola) { // se esiste (uno) studente con la stessa matricola
		$response = $response->withStatus(409); // conflict
	} else { //se non esiste nessuno studente con la stessa matricola
		//recupera l'id del corso dal nome
		$sql = 'SELECT id FROM corso WHERE descrizione = :descrizione';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['descrizione' => $value->{'corso'}]);
		$id_corso = $stmt->fetchAll();
		$sql = 'INSERT INTO studente (matricola, nome, cognome, voto, id_corso) 
						VALUES (:matricola, :nome, :cognome, :voto, :id_corso)';
		$stmt = $pdo->prepare($sql);
		$stmt->execute([
			'matricola' => $value->{'matricola'},
			'nome' => $value->{'nome'},
			'cognome' => $value->{'cognome'},
			'voto' => $value->{'voto'},
			'id_corso' => $id_corso[0]['id']
		]);
		$stmt->fetchAll();
		$sql = 'SELECT id FROM studente WHERE matricola = :matricola';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['matricola' => $value->{'matricola'}]);
		$result_id = $stmt->fetchAll();
		$response = $response->withStatus(201); //created
		$response->getBody()->write(json_encode($result_id[0]));
		$response->withHeader('Content-Type', 'application/json');
	}
	return $response;
});

$app->post('/tests', function (Request $request, Response $response, array $args) use ($pdo) {
	/* {"valutazione": "1", "tipologia": "teoria", "stato": "accettato", "note": null,
	"id_studente": "2", "id_esame": "1", "id_professore": "1"} */
	$body = $request->getBody();
	$value = json_decode($body);
	//TODO: valutare correttezza dell'id_studente
	$sql = 'select * from prova where id_studente = :id_studente order by id desc';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['id_studente' => $value->{'id_studente'}]);
	$res = $stmt->fetchAll();
	//TODO: controllo sulla validità della tipologia e dello stato
	$passed = true;
	if ($value->{'tipologia'} == 'teoria') {
		if ($res != array()) {
			$passed = false;
			function is_valid($test)
			{
				//return(array_key_exists('key', $test));
				return ($test['stato'] == "accettato");
			}

			$r = array_filter($res, 'is_valid');
			if ($r != array()) {
				if ($r[0]['tipologia'] == 'teoria') {

				}
			}
		}
	}
	$sql = 'INSERT INTO prova (valutazione, tipologia, stato, note, id_studente, id_esame, id_professore) 
						VALUES (:valutazione, :tipologia, :stato, :note, :id_studente, :id_esame, :id_professore)';
	$stmt = $pdo->prepare($sql);
	$stmt->execute([
		'valutazione' => $value->{'valutazione'},
		'tipologia' => $value->{'tipologia'},
		'stato' => $value->{'stato'},
		'note' => $value->{'note'},
		'id_studente' => $value->{'id_studente'},
		'id_esame' => $value->{'id_esame'},
		'id_professore' => $value->{'id_professore'}
	]);
	$result = $stmt->fetchAll();
	$response->getBody()->write(json_encode($res));
	return $response->withHeader('Content-Type', 'application/json');
});

$app->post('/exams', function (Request $request, Response $response, array $args) use ($pdo) {
	//{"data":"2022-03-17 15:24:21"} or {"data":"2022-03-17"}
	$body = $request->getBody();
	$value = json_decode($body);
	$sql = 'INSERT INTO esame (data) VALUES (:data)';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['data' => $value->{'data'}]);
	$stmt->fetchAll();
	$sql = 'SELECT id FROM corso WHERE data = :data';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['matricola' => $value->{'matricola'}]);
	$result_id = $stmt->fetchAll();
	$response->getBody()->write(json_encode($result_id[0]));
	$response->withHeader('Content-Type', 'application/json');
	return $response->withStatus(201); //created;
});

$app->post('/auth', function (Request $request, Response $response, array $args) {
	// mkpasswd -m sha256crypt --salt <salt>
	$body = $request->getBody();
	$value = json_decode($body);
	$username = $value->{'username'};
	$password = $value->{'password'};
	$jwt = authentication($username, $password);
	if ($jwt !== null) {
		$json = array('jwt' => $jwt);
		$response->getBody()->write(json_encode($json));
	} else {
		return $response->withStatus(401); //Unauthorized
	}
	return $response->withHeader('Content-Type', 'application/json')->withStatus(202); //accepted
});

$app->put('/students/{id}', function (Request $request, Response $response, array $args) use ($pdo) {
	// {"matricola": "123", "nome": "luca", "cognome": "mandolini", "voto": null, "id_corso": "1"}
	$body = $request->getBody();
	$value = json_decode($body);
	// controllare se uno studente con la stessa matricola esiste già
	$sql = 'SELECT * FROM studente WHERE matricola = :matricola AND id = :id';
	$stmt = $pdo->prepare($sql);
	$stmt->execute([
		'id' => $args['id'],
		'matricola' => $value->{'matricola'}
	]);
	if ($stmt->fetchAll()) { // se esiste uno studente con lo stesso id e la stessa matricola
		$sql = 'UPDATE studente SET nome = :nome, cognome = :cognome, voto = :voto, 
            matricola = :matricola, id_corso = :id_corso WHERE id = :id';
		$stmt = $pdo->prepare($sql);
		$stmt->execute([
			'id' => $args['id'],
			'matricola' => $value->{'matricola'},
			'nome' => $value->{'nome'},
			'cognome' => $value->{'cognome'},
			'voto' => $value->{'voto'},
			'id_corso' => $value->{'id_corso'}
		]);
		$stmt->fetchAll();
		$response->getBody()->write(json_encode(array('id' => $args['id'])));
		$response->withHeader('Content-Type', 'application/json');
		$response = $response->withStatus(201); // created
	} else { //se id e matricola non corrispondono
		$response = $response->withStatus(428); // Precondition Required
	}
	return $response;
});

$app->put('/tests/{id}', function (Request $request, Response $response, array $args) use ($pdo) {
	$body = $request->getBody();
	$value = json_decode($body);
	$sql = 'UPDATE prova SET valutazione = :valutazione, tipologia = :tipologia, stato = :stato,
						note = :note, id_studente = :id_studente, id_esame = :id_esame,
						id_professore = :id_professore WHERE id = :id';
	$stmt = $pdo->prepare($sql);
	$stmt->execute([
		'id' => $args['id'],
		'valutazione' => $value->{'valutazione'},
		'tipologia' => $value->{'tipologia'},
		'stato' => $value->{'stato'},
		'note' => $value->{'note'},
		'id_studente' => $value->{'id_studente'},
		'id_esame' => $value->{'id_esame'},
		'id_professore' => $value->{'id_professore'}
	]);
	$result = $stmt->fetchAll();
	$response->getBody()->write(json_encode($result));
	$response->withHeader('Content-Type', 'application/json');
	return $response;
});

//bypass CORS
$app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
	throw new HttpNotFoundException($request);
});

$app->run();
