# **_Programma per registrare le valutazioni degli esami_**

## **_Dettagli_**

- Gli esami sono 6 e sono calendarizzati secondo date precise
- L'esame è diviso in due parti la cui somma apporta un massimo di 30 punti
- Lo studente può scegliere se svolgere le due parti separatamente o contemporaneamente
- Lo studente può scegliere di accettare o rifiutare una valutazione

### **_Prima parte_**

Per superare la prima parte dell'esame sono necessari almeno 8 punti su un massimo di 15 punti disponibili.

### **_Seconda parte**_

Per superare la seconda parte dell'esame sono necessari almeno 8 punti su un massimo di 17 punti disponibili (17 punti equivalgono all'ottenimento della lode).  
Deve essere svolta entro un massimo di due tentativi, altrimenti anche la prima parte deve essere ripetuta.

### **_Orale_**

Se si ottiene un punteggio complessivo di 16 punti è necessario sottoporsi ad una prova orale per poter raggiungere i 18 punti richiesti.  
Può fare guadagnare o perdere punti fino ad un massimo di 3 e può essere eseguita anche da chi desidera migliorare il proprio punteggio.

### **_Correzione_**

L'esame può essere sottoposto alla correzione di più professori, perciò è necessario tenerne traccia.  
Nello storico degli esami, oltre ai punteggi delle prove, è necessario tenere traccia anche dell'eventuale valutazione orale.

## **_Build_**

### **_Client_**

Eseguire (in *client_uni*)

```bash
npm i
```

#### **_Reminder_**

Modificare path

### **_Server_**

Impostare il deployment della cartella *server_uni*

eseguire (in *server_uni*)

```bash
composer install
```

Creare il file *config.json* nella cartella *server_uni* affinchè sia simile a

```json
{
  "DB_HOST": "host",
  "DM_ADDR": "localhost",
  "DM_NAME": "dbname",
  "DB_NAME": "registrazione_esami",
  "DB_USER": "root",
  "DB_PASS": "password",
  "DB_CHAR": "utf8",
  "JWT_SECRET": "2ce207baa983740d6900c625644f54a3"
}
```

## **_Run_**

Avviare i processi di Xampp

Eseguire (in *client_uni*)

```bash
npm run dev
```
