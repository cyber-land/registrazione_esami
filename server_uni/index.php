<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Exception\HttpNotFoundException;
use Tuupola\Middleware\JwtAuthentication;
use Firebase\JWT\JWT;

require __DIR__ . '/vendor/autoload.php';
$app = AppFactory::create();

//recupera da __DIR__ uno slice successivo ad 'htdocs'
define('BASE_PATH', substr(__DIR__, strpos(__DIR__, "htdocs")+6));

$app->setBasePath(BASE_PATH); //"/RegistrazioneEsami/registrazione_esami/server_uni"

//impostare manualmente il file, siccome non può venire inserito nello storico di git
$data = file_get_contents('config.json');
$obj = json_decode($data, true);
$pdo = new PDO(
	"mysql:{$obj['DB_HOST']}={$obj['DM_ADDR']};{$obj['DM_NAME']}={$obj['DB_NAME']}",
	$obj['DB_USER']
);

//TODO: definire gli statuscode di ritorno lato server poi gestirli lato client
//TODO: impostare i limiti degli output affinchè la loro dimensione sia moderata
//TODO: limitare client-side il numero di fetch eseguite

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
		"path" => BASE_PATH,
		"ignore" => [BASE_PATH."/auth"],
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

//ritorna un nuovo token con gli stessi dati del token usato per chiamare questo metodo
$app->get('/renew_token', function (Request $request, Response $response, array $args) {
	$jwt = $request->getAttribute("token"); //recupera il token già decodificato
	$data = array('id' => $jwt['data']->{'id'}, 'username' => $jwt['data']->{'username'});
	$response->getBody()->write(json_encode(array('jwt' => getToken($data))));
	return $response->withHeader('Content-Type', 'application/json');
});

//shadow /students/{id}
$app->get('/students/{pattern}', function (Request $request, Response $response, array $args) use ($pdo) {
	$pattern = $args['pattern']; //TODO: controllo di validità
	$sql = "select studente.id, nome, cognome, matricola, id_corso, voto, descrizione as corso 
					from studente, corso where corso.id = studente.id_corso and 
					(matricola like :pattern or cognome like :pattern or nome like :pattern) limit 1";
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['pattern' => "%".$pattern.'%']);
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

	$sql = "select matricola,
					SUBSTRING(cognome, 1, 3) as cognome,
					SUBSTRING(nome, 1, 3) as nome,
					GROUP_CONCAT(
							if (
							    tipologia = 'teoria', 
							    if(valutazione<8,'INSUFF', valutazione), 
							    null
							)
					    ORDER BY prova.id
					) as teoria,
					GROUP_CONCAT(
					    if (
					        tipologia = 'programmazione', 
					        if(valutazione<8,'INSUFF', valutazione), 
					        null
					  	)
					    ORDER BY prova.id
					) as programmazione,
					sum(valutazione) as totale,
					null as note
					from esame, prova, studente
					where esame.id = :id
					and esame.id = prova.id_esame
					and studente.id = prova.id_studente
					and stato = 'accettato'
					group by studente.id
					order by studente.id";
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['id' => $args['id']]);
	$result = $stmt->fetchAll();
	$response->getBody()->write(json_encode($result));
	return $response;
});

//TODO: altri controlli sul voto ed il corso
$app->post('/students', function (Request $request, Response $response, $args) use ($pdo) {
	// {"matricola": "0012", "nome": "luca", "cognome": "mandolini", "voto": null, "corso": "informatica"}
	$body = $request->getBody();
	$value = json_decode($body);
	// controllare se uno studente con la stessa matricola esiste già
	$sql = 'SELECT * FROM studente WHERE matricola = :matricola';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['matricola' => $value->{'matricola'}]);
	$matricola = $stmt->fetchAll();
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

//TODO: controllare che l'esame sia in data uguale o successiva rispetto all'ultima prova *fatta*
//TODO: controllare che non ci sia un altro esame uguale (id_studente, id_esame). viene già controllato?
function is_correct($test): bool {
	global $pdo;

	//le note da controllare
	//controllare che lo stato sia tra le 3 possibilità
	$possibili_stati = array('accettato', 'rifiutato', 'ritirato');
	if (!in_array($test->{'stato'}, $possibili_stati)) {
		return false;
	}

	//controllare se id_studente, id_esame ed id_professore sono validi
	$sql = 'select * from studente where id = :id_studente';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['id_studente' => $test->{'id_studente'}]);
	$res = $stmt->fetchAll();
	if (!$res) return false;
	$sql = 'select * from professore where id = :id_professore';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['id_professore' => $test->{'id_professore'}]);
	$res = $stmt->fetchAll();
	if (!$res) return false;
	$sql = 'select * from esame where id = :id_esame';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['id_esame' => $test->{'id_esame'}]);
	$res = $stmt->fetchAll();
	if (!$res) return false;

	//controllo sulla correttezza della tipologia e valutazione
	$tipologia = $test->{'tipologia'};
	$valutazione = $test->{'valutazione'};
	if ($tipologia == 'teoria' && $valutazione <= 15) {
		$sql = 'select * from prova where id_studente = :id_studente and valutazione >= 8 
            and stato = "accettato" order by id desc limit 1';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id_studente' => $test->{'id_studente'}]);
		$result = $stmt->fetchAll();
		if (!$result || $result[0]['tipologia'] == 'teoria') {
				return true;
		}
		return false;
	} elseif ($tipologia == 'programmazione' && $valutazione <= 17) {
		//se l'ultima priva valida è orale ritorna false
		$sql = 'select * from prova where id_studente = :id_studente and stato = "accettato" order by id desc';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id_studente' => $test->{'id_studente'}]);
		$result = $stmt->fetchAll();
		if (!$result || $result[0]['tipologia'] == 'orale') {
			return false;
		}
		//controlla che l'ultima prova valida sia teoria
		$sql = 'select * from prova where id_studente = :id_studente and valutazione >= 8 
            and stato = "accettato" order by id desc';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id_studente' => $test->{'id_studente'}]);
		$result = $stmt->fetchAll();
		if (!$result) return false;
		if ($result[0]['tipologia'] == 'teoria') {
			return true;
		}
		//controlla se l'ultima valida è programmazione, controllando se ce ne sono più di una
		$sql = 'select * from prova where id_studente = :id_studente and valutazione >= 8 and stato = "accettato" 
        		and tipologia = "programmazione" order by id desc';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id_studente' => $test->{'id_studente'}]);
		$result = $stmt->fetchAll();
		if (sizeof($result) < 2) return true;
		return false;
	} elseif ($tipologia == 'orale' && $valutazione >= -3 && $valutazione <= 3) {
		//TODO: non controllare lo stato?
		$sql = 'select * from prova where id_studente = :id_studente and stato = "accettato" order by id desc limit 1';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id_studente' => $test->{'id_studente'}]);
		$result = $stmt->fetchAll();
		if ($result[0]['tipologia'] == 'programmazione') {
			return true;
		}
		return false;
	} else {
		//tipologia impossibile
		return false;
	}
	return false;
}

$app->post('/tests', function (Request $request, Response $response, array $args) use ($pdo) {
	/* {"valutazione": "1", "tipologia": "teoria", "stato": "accettato", "note": null,
	"id_studente": "2", "id_esame": "1", "id_professore": "1"} */
	$body = $request->getBody();
	$value = json_decode($body);
	$is_correct = is_correct($value);
	if ($is_correct) {
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
		$stmt->fetchAll();
		$response = $response->withStatus(201); //created
	} else {
		$response = $response->withStatus(428); //precondition required
	}
	//TODO: ritornare l'id (comando per ultimo inserimento della sessione anche in altre zone)
	$response->getBody()->write(json_encode($is_correct));
	return $response->withHeader('Content-Type', 'application/json');
});

//TODO: la data deve essere univoca? se non è univoca la data allora serve il tempo altrimenti bisogna eliminare il tempo globalmente
$app->post('/exams', function (Request $request, Response $response, array $args) use ($pdo) {
	//{"data":"2022-03-17 15:24:21"} or {"data":"2022-03-17"}
	$body = $request->getBody();
	$value = json_decode($body);
	$sql = 'INSERT INTO esame (data) VALUES (:data)';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['data' => $value->{'data'}]);
	$stmt->fetchAll();
	$sql = 'SELECT id FROM esame WHERE data = :data';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['data' => $value->{'data'}]);
	$result_id = $stmt->fetchAll();
	$response->getBody()->write(json_encode($result_id[0]));
	return $response->withHeader('Content-Type', 'application/json'); //created;
});

$app->post('/auth', function (Request $request, Response $response, array $args) {
	// mkpasswd -m sha256crypt --salt <salt>
	$body = $request->getBody();
	$value = json_decode($body);
	$username = $value->{'username'};
	$password = $value->{'password'};
	$jwt = authentication($username, $password);
	if ($jwt) {
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

//TODO: valutare la correttezza dell'input (dividere il controllo in varie funzioni)
$app->put('/tests/{id}', function (Request $request, Response $response, array $args) use ($pdo) {
	/* {"valutazione": "1", "tipologia": "teoria", "stato": "accettato", "note": null} */
	//TODO: se non è l'ultima prova ritorna un errore
	$body = $request->getBody();
	$value = json_decode($body);
	$sql = 'UPDATE prova SET valutazione = :valutazione, tipologia = :tipologia, 
        	stato = :stato, note = :note, id_esame = :id_esame WHERE id = :id';
	$stmt = $pdo->prepare($sql);
	$stmt->execute([
		'id' => $args['id'],
		'valutazione' => $value->{'valutazione'},
		'tipologia' => $value->{'tipologia'},
		'stato' => $value->{'stato'},
		'note' => $value->{'note'},
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
