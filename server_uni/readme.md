# Server

Server http che recupera dei parametri di configurazione dal file `config.json` che utilizza per fare il collegamento al database (mysql), per la generazione di bearer tokens (JWT) e settaggi di sistema

Abilita il lazy cors per semplificare l'utulizzo e risponde a diverse rotte REST

## Routes

| Method | Path                       | Description                                                                                                  |
|:------:|:--------------------------:| ------------------------------------------------------------------------------------------------------------ |
| GET    | /renew_token               | ritorna un nuovo token con gli stessi dati del token usato per chiamare questa rotta                         |
| GET    | /status                    | metodo di testing usato per controllare che il server sia online                                             |
| GET    | /students/search={pattern} | ritorna una lista di studenti che hanno dati corrispondenti al pattern e ritorna anche i loro test associati |
| GET    | /{table}                   | ritorna tutti gli elementi della tabella                                                                     |
| GET    | /{table}/{id}              | ritorna un elemento della tabella                                                                            |
| GET    | /exams/{id}/pdf            | ritorna i dati necessari per il l'esportazione in pdf dell'esame                                             |
| POST   | /students                  | creazione di un nuovo studente                                                                               |
| POST   | /tests                     | creazione di una nuova prova                                                                                 |
| POST   | /exams                     | creazione di un nuovo esame                                                                                  |
| POST   | /auth                      | inviando credenziali corrette ritorna un bearer token per l'utente                                           |
| PUT    | /students/{id}             | modifica dei dati di uno studente                                                                            |
| PUT    | /tests/{id}                | modifica dei dati di una prova                                                                               |
