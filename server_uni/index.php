<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Exception\HttpNotFoundException;
use Tuupola\Middleware\JwtAuthentication;

require __DIR__ . '/vendor/autoload.php';
require 'functions.php';

$app = AppFactory::create();

//recupero dei parametri di configurazione
$data = file_get_contents('config.json');
$obj = json_decode($data, true);

define('BASE_PATH', $obj['LOCAL_PATH']);

$app->setBasePath(BASE_PATH);

$pdo = new PDO(
	"mysql:{$obj['DB_HOST']}={$obj['DM_ADDR']};{$obj['DM_NAME']}={$obj['DB_NAME']}",
	$obj['DB_USER']
);

//TODO: definire gli status-code di ritorno lato server poi gestirli lato client
//TODO: impostare i limiti degli output affinché la loro dimensione sia moderata
//TODO: ritornare l'id (comando per ultimo inserimento della sessione anche in altre zone)

define('JWT_SECRET', (string)$obj['JWT_SECRET']);

//bypass CORS
$app->options('/{routes:.+}', function ($request, $response, $args) {
	return $response;
});

//bypass CORS
$app->add(function ($request, $handler) {
	$response = $handler->handle($request);
	return $response
		->withHeader('Access-Control-Allow-Origin', '*')
		->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
		->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

//eliminare l'accesso ai percorsi che non hanno un token valido nel l'header
$app->add(
	new JwtAuthentication([
		"path" => BASE_PATH,
		"ignore" => [BASE_PATH."/auth", BASE_PATH."/status"],
		"secret" => JWT_SECRET
	])
);

//ritorna un nuovo token con gli stessi dati del token usato per chiamare questo metodo
$app->get('/renew_token', function (Request $request, Response $response, array $args) {
	$jwt = $request->getAttribute("token"); //recupera il token già decodificato
	$data = array(
		'id' => $jwt['data']->{'id'},
		'surname' => $jwt['data']->{'surname'},
		'username' => $jwt['data']->{'username'}
	);
	$response->getBody()->write(json_encode(array('jwt' => getToken($data))));
	return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/status', function (Request $request, Response $response, array $args) {
	$response->getBody()->write(json_encode(status()));
	return $response->withHeader('Content-Type', 'application/json');
});

//ritorna gli studenti (e i loro test associati) che possiedono dati che rispettano il pattern cercato
$app->get('/students/search={pattern}', function (Request $request, Response $response, array $args) use ($pdo) {
	$pattern = "";
	try {$pattern = $args['pattern'];}
	catch (Exception $e) {}
	$sql = "select studente.id, nome, cognome, matricola, id_corso, voto, descrizione as corso 
					from studente, corso where corso.id = studente.id_corso and cognome like :pattern";
	//se la ricerca viene fatta per matricola (numero) allora controlla se ci sia una matricola uguale
	//altrimenti controlla se cognome e nome inizino con il pattern
	if (is_numeric($pattern)) {
		$sql = "select studente.id, nome, cognome, matricola, id_corso, voto, descrizione as corso 
					from studente, corso where corso.id = studente.id_corso and matricola = :pattern";
	}
	$stmt = $pdo->prepare($sql);
	if (is_numeric($pattern)) {
		$stmt->execute(['pattern' => $pattern]);
	} else {
		$stmt->execute(['pattern' => $pattern.'%']);
	}
	$students = $stmt->fetchAll();
	$res = array();
	foreach ($students as $row) {
		$sql = 'select * from prova, esame where id_esame = esame.id and id_studente = :id order by esame.data desc, prova.id desc';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id' => $row['id']]);
		$result = $stmt->fetchAll();
		array_push($res, array('student' => $row, 'tests' => $result));
		//$res[$row['id']] = array($row, $result);
	}
	$response->getBody()->write(json_encode($res));
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
	} elseif ($table == 'teachers') { //non espone gli hash delle password
		$sql = 'select id, nome, cognome, username from professore order by id desc';
		$stmt = $pdo->prepare($sql);
		$stmt->execute();
		$result = $stmt->fetchAll();
		$response->getBody()->write(json_encode($result));
	} else {
		$response->getBody()->write(json_encode(array("invalid table" => $table)));
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
		$response->getBody()->write(json_encode(array("invalid table" => $table)));
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

	$sql = "select matricola, SUBSTRING(cognome, 1, 3) as cognome, SUBSTRING(nome, 1, 3) as nome,
if (tipologia = 'teoria', if(valutazione<8,'INSUFF', valutazione), '') as teoria,
if (tipologia = 'programmazione', if(valutazione<8,'INSUFF', valutazione), '') as programmazione,
if (tipologia = 'programmazione' && valutazione >= 8,
    (select sum(valutazione) from prova
    where id_studente = studente.id
    and id_esame = prova.id_esame
    and stato = 'accettato'
    and tipologia != 'orale'),
    (select valutazione from prova
    where id_studente = studente.id
    and tipologia = 'teoria' and stato = 'accettato'
    order by id limit 1)
) as totale,
'' as note from esame, prova, studente where esame.id = :id and esame.id = prova.id_esame
and studente.id = prova.id_studente and stato = 'accettato' and tipologia != 'orale'
group by studente.id order by studente.id;";
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
		$response->getbody()->write(json_encode(array("errore" => "studente con la stessa matricola già esistente")));
		$response = $response->withStatus(409); // conflict
	} else { //se non esiste nessuno studente con la stessa matricola
		//recupera l'id del corso dal nome
		$sql = 'SELECT id FROM corso WHERE descrizione = :descrizione';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['descrizione' => $value->{'corso'}]);
		$id_corso = $stmt->fetchAll();
		$sql = 'INSERT INTO studente (matricola, nome, cognome, voto, id_corso) VALUES (:matricola, :nome, :cognome, :voto, :id_corso)';
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
	$is_correct = is_correct($value);
	if ($is_correct[0]) {
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
		$sql = 'SELECT LAST_INSERT_ID() as last_id';
		$stmt = $pdo->prepare($sql);
		$stmt->execute();
		$last_id_insert = $stmt->fetchAll();
		$response->getBody()->write(json_encode(array('id' => $last_id_insert[0]['last_id']))); //ritorna l'id del nuovo elemento
		$response = $response->withStatus(201); //created
	} else {
		$response->getBody()->write($is_correct[1]); //ritorna l'errore che ha fatto fallire l'inserimento
		$response = $response->withStatus(428); //precondition required
	}
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

	$response->getBody()->write(json_encode(""));
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
	$body = $request->getBody();
	$value = json_decode($body);
	//se non è l'ultima prova ritorna un errore
	$sql = 'select id, if(id = :id, true, false) as result from prova
where id_studente = (select id_studente from prova where id = :id)
order by id desc limit 1';
	$stmt = $pdo->prepare($sql);
	$stmt->execute(['id' => $args['id']]);
	$result = $stmt->fetchAll();
	if ($result[0]['result'] == true) { //è l'ultima prova effettuata dallo studente
		echo "true";
	}
	var_dump($result[0]['result']);

	//if (is_correct($body)) {
		$sql = 'UPDATE prova SET valutazione = :valutazione, tipologia = :tipologia, 
		          stato = :stato, note = :note WHERE id = :id';
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
	//} else {
		//$response = $response->withStatus(428); //precondition required
	//}
	return $response;
});

//bypass CORS
$app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
	throw new HttpNotFoundException($request);
});

$app->run();
