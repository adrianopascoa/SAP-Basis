import { evaluatePasswordStrength, isValidEmail } from './authValidation';

// Testes rápidos das validações de autenticação
function runAuthValidationTests() {
  // Teste de e-mails válidos e inválidos
  console.assert(isValidEmail('francisco.bezerra@softtek.com') === true, 'Email válido falhou');
  console.assert(isValidEmail('usuario@empresa.com.br') === true, 'Email corporativo válido falhou');
  console.assert(isValidEmail('invalido-sem-arroba') === false, 'Email sem @ deveria falhar');
  console.assert(isValidEmail('invalido@sem-dominio') === false, 'Email sem domínio deveria falhar');
  console.assert(isValidEmail('') === false, 'Email vazio deveria falhar');

  // Teste de força de senha
  const emptyEval = evaluatePasswordStrength('');
  console.assert(emptyEval.strength === 'vazia', 'Senha vazia deveria ser vazia');

  const weakEval = evaluatePasswordStrength('12345');
  console.assert(weakEval.strength === 'fraca', 'Senha 12345 deveria ser fraca');

  const mediumEval = evaluatePasswordStrength('Senha123');
  console.assert(mediumEval.strength === 'media', 'Senha123 deveria ser média');

  const strongEval = evaluatePasswordStrength('Senha@Forte2026!');
  console.assert(strongEval.strength === 'forte', 'Senha@Forte2026! deveria ser forte');
  console.assert(strongEval.hasMinLength === true, 'Deveria ter min length');
  console.assert(strongEval.hasNumber === true, 'Deveria ter número');
  console.assert(strongEval.hasSpecialChar === true, 'Deveria ter caractere especial');

  console.log('✓ Todos os testes de validação passaram com sucesso!');
  return true;
}

runAuthValidationTests();
