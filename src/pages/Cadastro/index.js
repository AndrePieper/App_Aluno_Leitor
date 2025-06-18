import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, Text, TextInput, TouchableOpacity, Image, Keyboard } from 'react-native';
import * as Device from 'expo-device';
import axios from 'axios';
import grupoFasipe from './grupo-fasipe.png';
import { Form } from '@unform/mobile';
import { BoxForm, Container } from './styles';

export default function Cadastro({ navigation }) {
  const formRef = useRef(null);
  const [DadosCadastro, setDadosCadastro] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [imei, setImei] = useState('1');
  const [mensagemErro, setMensagemErro] = useState('');
  const [tecladoVisivel, setTecladoVisivel] = useState(false);
  const [mensagemApi, setMensagemApi] = useState('');

  useEffect(() => {
    const obterImei = () => {
      const imeiDispositivo = Device.osInternalBuildId || '1';
      setImei(imeiDispositivo);
    };
    obterImei();

    const MostrarTeclado = Keyboard.addListener('keyboardDidShow', () => {
      setTecladoVisivel(true);
    });
    const EsconderTeclado = Keyboard.addListener('keyboardDidHide', () => {
      setTecladoVisivel(false);
    });

    return () => {
      EsconderTeclado.remove();
      MostrarTeclado.remove();
    };
  }, []);

  useEffect(() => {
    if (imei) {
      setDadosCadastro((prevValues) => ({
        ...prevValues,
        imei,
      }));
    }
  }, [imei]);

  function Texto_Input(input) {
    setDadosCadastro((prevValues) => ({
      ...prevValues,
      [input.name]: input.name === 'nome'
        ? input.value.trimStart() // remove espaços só no início
        : input.value,
    }));
  }

  async function Cadastrar() {
    const { nome, ra, email, senha, imei } = DadosCadastro;
    const nomeTratado = nome?.trim(); // remove espaços no início e fim

    if (nomeTratado && ra && email && senha && imei) {
      setCarregando(true);
      setMensagemErro('');
      setMensagemApi('');

      try {
        const api_url = "https://projeto-iii-4.vercel.app/usuarios/valida";
        const headers = { 'Content-Type': 'application/json' };

        const dadosTratados = {
          ...DadosCadastro,
          nome: nomeTratado,
        };

        const resposta = await axios.post(api_url, dadosTratados, { headers: headers });
        setCarregando(false);

        setMensagemApi(resposta.data.message || 'Cadastro realizado com sucesso!');

        if (resposta.status === 200) {
          await AsyncStorage.setItem('@email', email);
          navigation.navigate('Login');
        }
      } catch (erro) {
        setCarregando(false);
        const mensagemErroApi = erro.response?.data?.message || 'Erro desconhecido!';
        setMensagemErro(mensagemErroApi);
      }
    } else {
      setMensagemErro('Preencha todos os campos!');
    }
  }

  return (
    <Container>
      <StatusBar backgroundColor={"#00913D"} />
      <Image source={grupoFasipe} style={styles.logo} />

      <BoxForm style={styles.boxForm}>
        <Form ref={formRef} onSubmit={Cadastrar}>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            onChangeText={(e) => Texto_Input({ name: "nome", value: e })}
            value={DadosCadastro.nome || ""}
            name="nome"
          />

          <Text style={styles.label}>RA</Text>
          <TextInput
            style={styles.input}
            onChangeText={(e) => Texto_Input({ name: "ra", value: e })}
            value={DadosCadastro.ra || ""}
            name="ra"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            onChangeText={(e) => Texto_Input({ name: "email", value: e })}
            value={DadosCadastro.email || ""}
            name="email"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            onChangeText={(e) => Texto_Input({ name: "senha", value: e })}
            value={DadosCadastro.senha || ""}
            name="senha"
            secureTextEntry={true}
          />

          {mensagemErro !== '' && (
            <Text style={styles.erro}>{mensagemErro}</Text>
          )}

          {mensagemApi !== '' && (
            <Text style={styles.sucesso}>{mensagemApi}</Text>
          )}

          <TouchableOpacity onPress={() => {
            formRef.current.submitForm();
          }}>
            <View style={styles.botaoPadrao}>
              <Text style={styles.botaoPadraoTexto}>Cadastrar</Text>
            </View>
          </TouchableOpacity>

          {carregando && (
            <ActivityIndicator size="large" color="#00913D" style={styles.carregar} />
          )}
        </Form>
      </BoxForm>

      {!tecladoVisivel && (
        <View style={styles.rodape}>
          <View style={styles.rodapeRow}>
            <View style={styles.rodapeLinha}></View>
            <Text style={styles.rodapeTexto}>Chamada Fasipe</Text>
            <View style={styles.rodapeLinha}></View>
          </View>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 400,
    height: 100,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  boxForm: { marginBottom: 0 },
  label: { color: "#000", margin: 5 },
  input: {
    backgroundColor: "#fff",
    color: "#737276",
    borderWidth: 1,
    borderColor: "#737276",
    borderRadius: 5,
    margin: 5,
    padding: 10,
  },
  erro: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
  sucesso: {
    color: 'green',
    textAlign: 'center',
    marginVertical: 10,
  },
  botaoPadrao: {
    backgroundColor: "#00913D",
    alignItems: 'center',
    padding: 15,
    margin: 5,
    marginTop: 20,
    borderRadius: 5,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  botaoPadraoTexto: {
    color: "#fff",
    fontSize: 18,
  },
  carregar: {
    marginBottom: 10,
    marginTop: 10,
  },
  rodape: {
    position: 'absolute',
    flex: 0.1,
    left: 0,
    right: 0,
    bottom: 25,
  },
  rodapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  rodapeLinha: {
    borderBottomWidth: 2,
    borderColor: "#000",
    width: '20%',
    marginHorizontal: 5,
  },
  rodapeTexto: {
    color: "#000",
    textAlign: "center",
    fontSize: 16,
  },
  linkCadastro: {
    color: '#0000FF',
    textAlign: 'center',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
});
