export default interface TokenVerifier {
  verify(token: string): Promise<boolean>
}
