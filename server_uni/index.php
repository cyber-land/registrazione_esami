<?php
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
require __DIR__ . '/vendor/autoload.php';
$app = AppFactory::create();
$app->setBasePath("/server_uni");

//TODO: fare i controlli sull'input (verificare che i valori corrispondenti ad altre tabelle esistano)
//TODO: tagliare i valori cha hanno un numero per chiave
//TODO: controllare che l'id sia un numero (esclusi i non validi)

//shadow /students/{id}
$app->get('/students/{matricola}', function (Request $request, Response $response, array $args) {
	try {
		$pdo = new PDO('mysql:host=localhost;dbname=registrazione_esami', 'root');
		$matricola = $args['matricola']; //TODO: controllo di validità
		$sql = 'select * from studente where matricola=:matricola';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['matricola' => $matricola]);
		$result = $stmt->fetchAll();
		$response->getBody()->write(json_encode($result));
	} catch (Exception $e) {echo $e->getMessage();}
	return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/students/{id}/tests', function (Request $request, Response $response, array $args) {
	try {
		$pdo = new PDO('mysql:host=localhost;dbname=registrazione_esami', 'root');
		$sql = 'select * from prova, esame where id_esame = esame.id 
    				and id_studente = :id order by esame.data desc, prova.id desc';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id' => $args['id']]);
		$result = $stmt->fetchAll();
		$response->getBody()->write(json_encode($result));
	} catch (Exception $e) {echo $e->getMessage();}
	return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/{table}', function (Request $request, Response $response, array $args) {
	$table = $args['table'];
	$tables = array('students' => 'studente', 'courses' => 'corso', 'tests' => 'prova',
		'teachers' => 'professore', 'exams' => 'esame');
	if (array_key_exists($table, $tables)) {
		try {
			$pdo = new PDO('mysql:host=localhost;dbname=registrazione_esami', 'root');
			$sql = 'select * from ' . $tables[$table] . ' order by id desc';
			$stmt = $pdo->prepare($sql);
			$stmt->execute();
			$result = $stmt->fetchAll();
			$response->getBody()->write(json_encode($result));
		} catch (Exception $e) {
			echo $e->getMessage();
		}
	} else {
		$response->getBody()->write(json_encode("invalid table name: " . $table));
	}
	return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/{table}/{id}', function (Request $request, Response $response, array $args) {
	$table = $args['table'];
	$tables = array('students' => 'studente', 'courses' => 'corso', 'tests' => 'prova',
		'teachers' => 'professore', 'exams' => 'esame');
	if (array_key_exists($table, $tables)) {
		try {
			$pdo = new PDO('mysql:host=localhost;dbname=registrazione_esami', 'root');
			$sql = 'select * from ' . $tables[$table] . ' where id=:id';
			$stmt = $pdo->prepare($sql);
			$stmt->execute(['id' => $args['id']]);
			$result = $stmt->fetchAll();
			$response->getBody()->write(json_encode($result));
		} catch (Exception $e) {
			echo $e->getMessage();
		}
	} else {
		$response->getBody()->write(json_encode("invalid table name: " . $table));
	}
	return $response->withHeader('Content-Type', 'application/json');
});

$app->post('/students', function (Request $request, Response $response, $args) {
	/* {"matricola": "0012", "nome": "luca", "cognome": "mandolini",
	"voto": null, "corso": "informatica"} */
	$body = $request->getBody();
	$value = json_decode($body);
	try {
		$pdo = new PDO('mysql:host=localhost;dbname=registrazione_esami', 'root');
		$sql = 'SELECT * FROM corso WHERE descrizione = :descrizione';
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
		$result = $stmt->fetchAll();
		$response->getBody()->write(json_encode($result));
		$response->withHeader('Content-Type', 'application/json');
	} catch (Exception $e) {
		echo $e->getMessage();
	}
	return $response;
});

/*
 * lo studente può scegliere se svolgere le due parti separatamente o contemporaneamente
 *
 */

$app->post('/tests', function (Request $request, Response $response, array $args) {
	/* {"valutazione": "1", "tipologia": "teoria", "stato": "accettato", "note": null,
	"id_studente": "2", "id_esame": "1", "id_professore": "1"} */
	$body = $request->getBody();
	$value = json_decode($body);
	try {
		//TODO: valutare correttezza dell'id_studente
		$pdo = new PDO('mysql:host=localhost;dbname=registrazione_esami', 'root');
		$sql = 'select * from prova where id_studente = :id_studente order by id desc';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['id_studente' => $value->{'id_studente'}]);
		$res = $stmt->fetchAll();
		//controllo sulla validità della tipologia e dello stato
		$passed = true;
		if ($value->{'tipologia'} == 'teoria') {
			if ($res != array()) {
				$passed = false;
				function is_valid($test) {
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
	} catch (Exception $e) {
		echo $e->getMessage();
	}
	return $response->withHeader('Content-Type', 'application/json');
});

$app->post('/exams', function (Request $request, Response $response, array $args) {
	//"data":"2022-03-17 15:24:21" or "data":"2022-03-17"
	$body = $request->getBody();
	$value = json_decode($body);
	try {
		$pdo = new PDO('mysql:host=localhost;dbname=registrazione_esami', 'root');
		$sql = 'INSERT INTO esame (data) VALUES (:data)';
		$stmt = $pdo->prepare($sql);
		$stmt->execute(['data' => $value->{'data'}]);
		$result = $stmt->fetchAll();
		$response->getBody()->write(json_encode($result));
		$response->withHeader('Content-Type', 'application/json');
	} catch (Exception $e) {
		echo $e->getMessage();
	}
	return $response;
});

$app->put('/students/{id}', function (Request $request, Response $response, array $args) {
	/* {"matricola": "0012", "nome": "luca", "cognome": "mandolini", "voto": null, "id_corso": "1"} */
	$body = $request->getBody();
	$value = json_decode($body);
	try {
		$pdo = new PDO('mysql:host=localhost;dbname=registrazione_esami', 'root');
		$sql = 'UPDATE studente SET matricola = :matricola, nome = :nome, cognome = :cognome, 
						voto = :voto, id_corso = :id_corso WHERE id = :id';
		$stmt = $pdo->prepare($sql);
		$stmt->execute([
			'id' => $args['id'],
			'matricola' => $value->{'matricola'},
			'nome' => $value->{'nome'},
			'cognome' => $value->{'cognome'},
			'voto' => $value->{'voto'},
			'id_corso' => $value->{'id_corso'}
		]);
		$result = $stmt->fetchAll();
		$response->getBody()->write(json_encode($result));
		$response->withHeader('Content-Type', 'application/json');
	} catch (Exception $e) {
		echo $e->getMessage();
	}
	return $response;
});

$app->put('/tests/{id}', function (Request $request, Response $response, array $args) {
	$body = $request->getBody();
	$value = json_decode($body);
	try {
		$pdo = new PDO('mysql:host=localhost;dbname=registrazione_esami', 'root');
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
	} catch (Exception $e) {
		echo $e->getMessage();
	}
	return $response;
});

$app->run();
