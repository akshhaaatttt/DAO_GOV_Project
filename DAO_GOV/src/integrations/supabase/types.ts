export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      members: {
        Row: {
          address: string
          joindate: string | null
          proposalscreated: number
          status: string
          votesparticipated: number
          votingpower: number
        }
        Insert: {
          address: string
          joindate?: string | null
          proposalscreated?: number
          status: string
          votesparticipated?: number
          votingpower?: number
        }
        Update: {
          address?: string
          joindate?: string | null
          proposalscreated?: number
          status?: string
          votesparticipated?: number
          votingpower?: number
        }
        Relationships: []
      }
      proposals: {
        Row: {
          abstainvotes: number
          againstvotes: number
          created_at: string | null
          creator: string
          creatoraddress: string
          description: string
          endtime: string
          forvotes: number
          id: string
          starttime: string
          status: string
          title: string
        }
        Insert: {
          abstainvotes?: number
          againstvotes?: number
          created_at?: string | null
          creator: string
          creatoraddress: string
          description: string
          endtime: string
          forvotes?: number
          id: string
          starttime: string
          status: string
          title: string
        }
        Update: {
          abstainvotes?: number
          againstvotes?: number
          created_at?: string | null
          creator?: string
          creatoraddress?: string
          description?: string
          endtime?: string
          forvotes?: number
          id?: string
          starttime?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          executiondelay: number
          id: number
          proposalthreshold: number
          quorum: number
          votingdelay: number
          votingperiod: number
        }
        Insert: {
          executiondelay?: number
          id: number
          proposalthreshold?: number
          quorum?: number
          votingdelay?: number
          votingperiod?: number
        }
        Update: {
          executiondelay?: number
          id?: number
          proposalthreshold?: number
          quorum?: number
          votingdelay?: number
          votingperiod?: number
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string | null
          id: string
          proposalid: string
          voter: string
          votetype: string
          votingpower: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          proposalid: string
          voter: string
          votetype: string
          votingpower?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          proposalid?: string
          voter?: string
          votetype?: string
          votingpower?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_proposalid_fkey"
            columns: ["proposalid"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
