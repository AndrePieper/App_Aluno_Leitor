import React, { useRef, useState } from "react";
import { StyleSheet, Button, View, Modal, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const qrCodeLock = useRef(false); // <-- aqui está a variável

  async function handleOpenCamera() {
    try {
      const { granted } = await requestPermission();
      if (!granted) {
        return Alert.alert("Permissão negada");
      }
      qrCodeLock.current = false;
      setModalVisible(true);
    } catch (error) {
      console.log(error);
    }
  }

  function handleQRCodeRead(data) {
    setModalVisible(false);
    Alert.alert("QR Code", data);
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="Abrir Câmera" onPress={handleOpenCamera} />
      <Modal visible={modalVisible} animationType="slide">
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={({ data }) => {
            if (data && !qrCodeLock.current) {
              qrCodeLock.current = true;
              setTimeout(() => handleQRCodeRead(data), 500);
            }
          }}
        />
      </Modal>
    </View>
  );
}
