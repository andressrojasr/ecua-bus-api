require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./swagger'); // Ajusta la ruta según la ubicación del archivo

const app = express();

// Configuración de Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://ecuabus-33f65.firebaseio.com"
});

app.use(cors());
app.use(bodyParser.json());

/**
 * @swagger
 * /ecuabus/{idCoop}/{type}:
 *   post:
 *     summary: Crear un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: idCoop
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la cooperativa
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: Tipo de usuario (por ejemplo, pasajeros, conductores)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               card:
 *                 type: string
 *               photo:
 *                 type: string
 *               isBlocked:
 *                 type: boolean
 *               rol:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Faltan campos obligatorios o error en los datos proporcionados
 *       500:
 *         description: Error interno del servidor
 */
app.post('/ecuabus/:idCoop/:type', async (req, res) => {
    const { idCoop, type } = req.params;
    const { address, card, email, isBlocked, lastName, name, photo, phone, rol, password } = req.body;

    if (!email || !password || !name || !lastName) {
        return res.status(400).send({ message: 'Faltan campos obligatorios: email, password, name o lastName.' });
    }

    try {
        const newUser = await admin.auth().createUser({
            email,
            password,
            displayName: `${name} ${lastName}`,
            phoneNumber: phone || null
        });

        const userDoc = admin.firestore().collection(`users`).doc(newUser.uid);
        await userDoc.set({
            email,
            name,
            lastName,
            phone,
            address,
            card,
            photo,
            isBlocked,
            phone,
            rol,
            uid: newUser.uid,
            uidCooperative: idCoop,
        });

        res.status(201).send({ message: 'Usuario creado exitosamente', uid: newUser.uid });
    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            res.status(400).send({ message: 'El correo electrónico ya está registrado.', error });
        }
        else if (error.code === 'auth/phone-number-already-exists') {
            res.status(400).send({ message: 'El número de telefono ya está registrado.', error });
        } else {
            console.error('Error al crear el usuario:', error);
            res.status(500).send({ message: 'Error al crear el usuario.', error });
        }
    }
});

/**
 * @swagger
 * /ecuabus/{id}/{idCoop}/{type}:
 *   put:
 *     summary: Actualizar un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario
 *       - in: path
 *         name: idCoop
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la cooperativa
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: Tipo de usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               card:
 *                 type: string
 *               photo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       400:
 *         description: Error en los datos proporcionados
 */
app.put('/ecuabus/:id/:idCoop/:type', async (req, res) => {
    const { id, idCoop, type } = req.params;
    const { address, card, email, lastName, name, phone, photo, password } = req.body;

    try {
        const updateFields = {
            displayName: `${name} ${lastName}`,
        };

        if (email) {
            updateFields.email = email;
        }
        if (phone) {
            updateFields.phoneNumber = phone;
        }
        if (password) {
            updateFields.password = password;
        }

        await admin.auth().updateUser(id, updateFields);

        const firestoreUpdateFields = {
            address,
            card,
            name,
            lastName,
            photo
        };

        if (email) {
            firestoreUpdateFields.email = email;
        }
        if (phone) {
            firestoreUpdateFields.phone = phone;
        }

        const userDoc = admin.firestore().collection(`users`).doc(id);
        await userDoc.update(firestoreUpdateFields);

        res.status(200).send({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            res.status(400).send({ message: 'El correo electrónico ya está registrado.', error });
        } else if (error.code === 'auth/phone-number-already-exists') {
            res.status(400).send({ message: 'El número de telefono ya está registrado.', error });
        } else {
            res.status(400).send({ message: 'Error al actualizar el usuario', error });
        }
    }
});

/**
 * @swagger
 * /ecuabus/{id}/{idCoop}/{type}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario
 *       - in: path
 *         name: idCoop
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la cooperativa
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: Tipo de usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       400:
 *         description: Error al eliminar el usuario
 */
app.delete('/ecuabus/:id/:idCoop/:type', async (req, res) => {
    const { id, idCoop, type } = req.params;

    try {
        await admin.auth().deleteUser(id);

        const userDoc = admin.firestore().collection(`users`).doc(id);
        await userDoc.delete();

        res.status(200).send({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(400).send({ message: 'Error al eliminar el usuario', error });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});
