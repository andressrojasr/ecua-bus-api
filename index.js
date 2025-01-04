const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
    // credential: admin.credential.cert(require('./ecuabus-33f65-firebase-adminsdk-8hru4-adba7cd730.json')),
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://ecuabus-33f65.firebaseio.com"
});
app.use(cors());
app.use(bodyParser.json());

app.post('/ecuabus/:idCoop/:type', async (req, res) => {
    const { idCoop, type } = req.params;
    const { address, card, email, isBlocked, lastName, name, photo, phone, rol, password} = req.body;

    if (!email || !password || !name || !lastName) {
        return res.status(400).send({ message: 'Faltan campos obligatorios: email, password, name o lastName.' });
    }

    try {
        // Crear el usuario en Firebase Authentication
        const newUser = await admin.auth().createUser({
            email,
            password,
            displayName: `${name} ${lastName}`,
            phoneNumber: phone || null
        });

        // Guardar los datos adicionales en Firestore
        const userDoc = admin.firestore().collection(`cooperatives/${idCoop}/${type}`).doc(newUser.uid);
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

// Ruta para actualizar un usuario
app.put('/ecuabus/:id/:idCoop/:type', async (req, res) => {
    const { id, idCoop, type } = req.params;
    const { address, card, email, lastName, name, phone, photo, password } = req.body;

    try {
        const updateFields = {
            displayName: `${name} ${lastName}`,
        };

        // Si se proporciona una contraseña, añadirla a los campos a actualizar
        if (email) {
            updateFields.email = email;  // Solo se añade si el email existe
        }
        if (phone) {
            updateFields.phoneNumber = phone;  // Solo se añade si el teléfono existe
        }
        if (password) {
            updateFields.password = password; // Añadir password si existe
        }

        // Actualizar usuario en Firebase Authentication
        await admin.auth().updateUser(id, updateFields);

        // Crear un objeto para la actualización del documento de Firestore
        const firestoreUpdateFields = {
            address,
            card,
            name,
            lastName,
            photo
        };

        // Solo añadir email y phone a Firestore si existen
        if (email) {
            firestoreUpdateFields.email = email;
        }
        if (phone) {
            firestoreUpdateFields.phone = phone;
        }

        // Actualizar documento en Firestore
        const userDoc = admin.firestore().collection(`cooperatives/${idCoop}/${type}`).doc(id);
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


// Ruta para eliminar un usuario
app.delete('/ecuabus/:id/:idCoop/:type', async (req, res) => {
    const { id,idCoop,type } = req.params;

    try {
        await admin.auth().deleteUser(id);

        const userDoc = admin.firestore().collection(`cooperatives/${idCoop}/${type}`).doc(id);
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
