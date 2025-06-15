import styled from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background: #d9d9d9
`
export const Aviso=styled.View`
    padding: 10px;
    margin: 5px;
    color: #d9d9d9;
    border-radius: 5px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: wrap;
    background-color: ${(props) => (props.sev === "error" ? '#721c24' : props.sev === "success" ? '#155724' : "#004085" )};
    margin-bottom: 35px;
`;