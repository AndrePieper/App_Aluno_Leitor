import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Avatar } from 'react-native-elements';
import { Container } from './styles';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function Home() {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [cpfUsuario, setCpfUsuario] = useState('');
  const [raUsuario, setRaUsuario] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [token, setToken] = useState('');
  const [erroToken, setErroToken] = useState('');

  const route = useRoute();
  const navigation = useNavigation();

  const [mensagem, setMensagem] = useState('');
  const [mostrarMensagem, setMostrarMensagem] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const decode_Token = (token) => {
    try {
      const [, payload] = token.split('.');
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const base64F = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const jsonPayload = decodeURIComponent(
        atob(base64F)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (erro) {
      console.error(erro);
      return null;
    }
  };

  useEffect(() => {
    const Info_Usuario = async () => {
      try {
        const fotoSalva = await AsyncStorage.getItem('@foto_perfil');
        const tokenSalvo = await AsyncStorage.getItem('@token');
        setToken(tokenSalvo);

        if (tokenSalvo) {
          const DadosToken = decode_Token(tokenSalvo);
          if (DadosToken) {
            setNomeUsuario(DadosToken.nome || '');
            setCpfUsuario(DadosToken.cpf || '');
            setRaUsuario(DadosToken.ra || '');
            await AsyncStorage.setItem('@id_aluno', DadosToken.id.toString());
          } else {
            setErroToken('Token inválido ou expirado');
          }
        }

        if (fotoSalva) {
          setFotoPerfil(fotoSalva);
        }
      } catch (erro) {
        console.error(erro);
      }
    };

    Info_Usuario();
  }, []);

  useEffect(() => {
    console.log('Route params:', route.params);
    if (route.params?.mensagem) {
      mostrarMensagemFunc(route.params.mensagem);
      navigation.setParams({ mensagem: undefined });
    }
  }, [route.params]);

  function mostrarMensagemFunc(texto) {
    setMensagem(texto);
    setMostrarMensagem(true);
    fadeAnim.setValue(1);
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setMostrarMensagem(false);
      });
    }, 5000);
  }

  const Foto_Usuario = () => {
    launchImageLibrary({ mediaType: 'photo' }, async (resposta) => {
      if (!resposta.didCancel && resposta.assets?.length > 0) {
        const caminhoFoto = resposta.assets[0].uri;
        setFotoPerfil(caminhoFoto);
        await AsyncStorage.setItem('@foto_perfil', caminhoFoto);
      }
    });
  };

  return (
    <Container>
      <StatusBar backgroundColor="#00913D" />
      <TouchableOpacity onPress={Foto_Usuario}>
        <Avatar
          rounded
          size="xlarge"
          source={{ uri: fotoPerfil || 'https://via.placeholder.com/150' }}
          containerStyle={styles.avatar}
        />
      </TouchableOpacity>

      <View style={styles.card}>
        {nomeUsuario ? <Text style={styles.texto}>{`Nome: ${nomeUsuario}`}</Text> : null}
        {cpfUsuario ? <Text style={styles.texto}>{`CPF: ${cpfUsuario}`}</Text> : null}
        {raUsuario ? <Text style={styles.texto}>{`Matrícula: ${raUsuario}`}</Text> : null}
        {erroToken ? <Text style={styles.erro}>{erroToken}</Text> : null}
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Leitor')}>
        <View style={styles.botaoPadrao}>
          <Text style={styles.botaoPadraoTexto}>Validar Presença</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.rodape}>
        <View style={styles.rodapeRow}>
          <View style={styles.rodapeLinha} />
          <Text style={styles.rodapeTexto}>Chamada Fasipe</Text>
          <View style={styles.rodapeLinha} />
        </View>
      </View>

      {mostrarMensagem && (
        <Animated.View
          style={[
            styles.mensagemContainer,
            {
              backgroundColor: '#388E3C',
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.mensagemTexto}>{mensagem}</Text>
        </Animated.View>
      )}
    </Container>
  );
}


const styles = StyleSheet.create({
  avatar: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  texto: {
    color: '#000000',
    fontSize: 20,
    marginBottom: 5,
    textAlign: 'center',
  },
  erro: {
    color: 'red',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  botaoPadrao: {
    backgroundColor: '#00913D',
    alignItems: 'center',
    padding: 15,
    margin: 5,
    marginTop: 20,
    borderRadius: 5,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  botaoPadraoTexto: {
    color: '#fff',
    fontSize: 18,
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
    borderColor: '#000',
    width: '20%',
    marginHorizontal: 5,
  },
  rodapeTexto: {
    color: '#000',
    textAlign: 'center',
    fontSize: 16,
  },
mensagemContainer: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  paddingTop: 60,
  paddingBottom: 30,
  paddingHorizontal: 20,
  backgroundColor: '#388E3C',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
  borderBottomLeftRadius: 24,
  borderBottomRightRadius: 24,
  elevation: 6,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 5,
},

mensagemTexto: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 18,
  textAlign: 'center',
},

});
